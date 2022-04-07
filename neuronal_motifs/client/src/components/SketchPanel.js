import React, {useState, useEffect, useContext} from 'react';
import './SketchPanel.css'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUpDownLeftRight, faEraser} from "@fortawesome/free-solid-svg-icons";
import paper from 'paper'
import {std, mean, distance} from 'mathjs'
import {AppContext} from "../contexts/GlobalContext";
import {getRandomColor} from "../utils/rendering";

function Arrow(mouseDownPoint) {
    this.start = mouseDownPoint;
    this.headLength = 10;
    this.tailLength = 9;
    this.headAngle = 35;
    this.tailAngle = 110
}

Arrow.prototype.draw = function (point) {
    var end = point;
    var arrowVec = this.start.subtract(end);

    // parameterize {headLength: 20, tailLength: 6, headAngle: 35, tailAngle: 110}
    // construct the arrow
    var arrowHead = arrowVec.normalize(this.headLength);
    var arrowTail = arrowHead.normalize(this.tailLength);

    var p3 = end;                  // arrow point

    var p2 = end.add(arrowHead.rotate(-this.headAngle));   // leading arrow edge angle
    var p4 = end.add(arrowHead.rotate(this.headAngle));    // ditto, other side

    var p1 = p2.add(arrowTail.rotate(this.tailAngle));     // trailing arrow edge angle
    var p5 = p4.add(arrowTail.rotate(-this.tailAngle));    // ditto

    // specify all but the last segment, closed does that
    this.path = new paper.Path(this.start, p1, p2, p3, p4, p5);
    this.path.closed = true;

    this.path.strokeWidth = 1
    this.path.strokColor = 'black'
    this.path.fillColor = 'black'

    return this.path
}

function SketchPanel() {

    const sketchPanelId = "sketch-panel";
    // Keeps track of the most recent thing drawn
    let [path, setPath] = useState();
    let [nodes, setNodes] = useState([])
    let [edges, setEdges] = useState([])
    let [pencil, setPencil] = useState();
    // We track the overall motif in the global context
    const context = useContext(AppContext);


    // Checks to see if the points in a path are roughly circular,
    // if so draw a circle that resembles them
    const isCircle = (p) => {
        let points = p?.segments.map(segment => {
            return [segment.point._x, segment.point._y]
        })
        let pointMean = mean(points, 0)
        let pointDistances = points.map(e => distance(e, pointMean))

        let distancesMean = mean(pointDistances);
        let distancesStd = std(pointDistances);
        if ((distancesMean / distancesStd) > 3) {
            let numNodes = nodes?.length || 0
            let color = numNodes <= context.colors.length ? context.colors[numNodes] : '#000000';
            let circle = new paper.Path.Circle(pointMean, distancesMean)
            circle.strokeColor = 'black';
            circle.fillColor = color;
            let textPoint = [pointMean[0], pointMean[1] - distancesMean - 3]
            let label = new paper.PointText({
                point: textPoint,
                justification: 'center',
                fontSize: 20
            });

            let labelLetter = String.fromCharCode(65 + (numNodes))

            setNodes(nodes => [...nodes, circle]);
            label.content = labelLetter;

            let tmp_edges = [...edges];
            tmp_edges.push([]);
            setEdges(tmp_edges);

            return true;
        }

    }

    // Checks to see if a path intersects exatly two nodes, and is thus an edge
    const isLine = (p) => {
        let intersections = nodes.map(e => {
            let intersect = e.getIntersections(p);
            return intersect && intersect.length > 0;
        })
        let intersectingIndices = [...intersections.keys()].filter(i => intersections[i]) || [];
        // Edge can only connect 2 nodes
        if (intersectingIndices.length !== 2) {
            return false
        }

        let circleA = nodes[intersectingIndices[0]];
        let circleB = nodes[intersectingIndices[1]];
        let startingPoint = [p.segments[0].point._x, p.segments[0].point._y];
        // Check if the edge is A -> B or B -> A depending on which node the edge starts closest to
        let distanceToCircleA = distance([circleA.position._x, circleA.position._y], startingPoint)
        let distanceToCircleB = distance([circleB.position._x, circleB.position._y], startingPoint)

        let drawEdge = null;
        let startNode, endNode = null;
        if (distanceToCircleA < distanceToCircleB) {
            console.log('Close to A')
            let tmp_edges = JSON.parse(JSON.stringify(edges)); // deepcopy
            if (!tmp_edges[intersectingIndices[1]].includes(intersectingIndices[0])) {
                tmp_edges[intersectingIndices[1]].push(intersectingIndices[0]);
                drawEdge = tmp_edges
                startNode = circleA;
                endNode = circleB;

            }


        } else { // Start at B going to A
            let tmp_edges = JSON.parse(JSON.stringify(edges)); // deepcopy
            if (!tmp_edges[intersectingIndices[0]].includes(intersectingIndices[1])) {
                tmp_edges[intersectingIndices[0]].push(intersectingIndices[1]);
                drawEdge = tmp_edges;
                startNode = circleB;
                endNode = circleA;
            }
        }
        // Draw the edge
        if (drawEdge && startNode && endNode) {
            let arrow = new Arrow(new paper.Point([startNode.position._x, startNode.position._y]))
            arrow.draw(new paper.Point([endNode.position._x, endNode.position._y]))
            setEdges(drawEdge);

        }

        //let arrow = new Arrow(new paper.Point([start.position._x, start.position._y]))
        //arrow.draw(new paper.Point([end.position._x, end.position._y]))
    }

    const clearSketch = () => {
        console.log('Clearing')
        paper?.project?.activeLayer?.removeChildren();
        paper?.view?.draw();
        // Remove all edges and nodes
        setNodes([]);
        setEdges([]);

    }

    const bindPencilEvents = () => {
        let mouseCircle, currentPath;
        console.log('rebinding', nodes);
        pencil.onMouseDown = function (event) {
            console.log('down', nodes);
            let intersections = nodes.map(n=>{
                return n.contains(event.point)
            })
            console.log('Intersections', intersections)
            currentPath = new paper.Path();

            currentPath.strokeColor = '#A9A9A9';
            currentPath.strokeWidth = 5
            currentPath.add(event.point);
            mouseCircle = new paper.Path.Circle(event.point, 7);
            mouseCircle.strokeColor = '#f41f23';
        }
        pencil.onMouseDrag = function (event) {
            currentPath.add(event.point);
            currentPath.smooth({type: 'continuous'});
            mouseCircle.position = new paper.Point(event.point);
        }
        pencil.onMouseUp = function (event) {
            setPath(currentPath);
            mouseCircle.remove()
            mouseCircle = null;
        }

    }
    useEffect(() => {
        if (pencil) {
            // Rebind the pencil events whenever new nodes are drawn
            bindPencilEvents();
        }
    }, [pencil, nodes])


    // On init set up our paperjs
    useEffect(() => {
        let scope = paper.setup(sketchPanelId);
        console.log('Setting up Pencil')
        setPencil(new paper.Tool());
    }, []);


    // Check if our path is node or edge
    useEffect(() => {
        if (path) {
            isLine(path) || isCircle(path);
            path?.remove()
        }
    }, [path])

    // Update global motif tracker
    useEffect(() => {
        if (edges) {
            context.setMotifQuery(edges);
        }

    }, [edges])


    return (
        <div className={'sketch-panel-style'}>
            <div className="eraser">
                <FontAwesomeIcon icon={faEraser} onClick={((e) => clearSketch(e))}/>
            </div>
            <canvas id={sketchPanelId}></canvas>
        </div>
    );

}

export default SketchPanel;