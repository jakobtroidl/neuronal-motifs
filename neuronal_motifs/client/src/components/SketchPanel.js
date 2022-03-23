import React, {useState, useEffect, useContext} from 'react';
import './SketchPanel.css'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUpDownLeftRight, faEraser} from "@fortawesome/free-solid-svg-icons";
import paper from 'paper'
import {std, mean, distance} from 'mathjs'
import {AppContext} from "../contexts/AbstractionLevelContext";

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
    let [edges, setEdges] = useState({});
    let [myEdges, setMyEdges] = useState([])

    // We track the overall motif in the global context
    const context = useContext(AppContext);


    const getColor = (i) => {
        let colorList = ['#8dd3c7', '#ffffb3', '#bebada', '#fb8072', '#80b1d3', '#fdb462', '#b3de69', '#fccde5']
        return colorList[i % 10]
        // const letters = '0123456789ABCDEF';
        // let color = '#';
        // for (let i = 0; i < 6; i++) {
        //     color += letters[Math.floor(Math.random() * 16)];
        // }
        // return color;
    }

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
            let circle = new paper.Path.Circle(pointMean, distancesMean)
            circle.strokeColor = 'black';
            circle.fillColor = getColor(numNodes);
            let textPoint = [pointMean[0], pointMean[1] - distancesMean - 3]
            let label = new paper.PointText({
                point: textPoint,
                justification: 'center',
                fontSize: 20
            });

            let labelLetter = String.fromCharCode(65 + (numNodes))
            circle.fillColor = getRandomColor();

            setNodes(nodes => [...nodes, circle]);
            label.content = labelLetter;

            let tmp_edges = [...myEdges];
            tmp_edges.push([]);
            setMyEdges(tmp_edges);

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

        console.log(intersectingIndices);

        let circleA = nodes[intersectingIndices[0]];
        let circleB = nodes[intersectingIndices[1]];
        let startingPoint = [p.segments[0].point._x, p.segments[0].point._y];
        // Check if the edge is A -> B or B -> A depending on which node the edge starts closest to
        let distanceToCircleA = distance([circleA.position._x, circleA.position._y], startingPoint)
        let distanceToCircleB = distance([circleB.position._x, circleB.position._y], startingPoint)
        // Start at A, going to B
        let edge;
        let start, end;
        let circleAChar = String.fromCharCode(65 + intersectingIndices[0])
        let circleBChar = String.fromCharCode(65 + intersectingIndices[1])
        //let edge;
        //let circleAChar = String.fromCharCode(65 + intersectingIndices[0])
        //let circleBChar = String.fromCharCode(65 + intersectingIndices[1])
        if (distanceToCircleA < distanceToCircleB) {
            edge = `${circleAChar} -> ${circleBChar}`
            start = circleA
            end = circleB
            let tmp_edges = [...myEdges];
            console.log(tmp_edges);
            if (!tmp_edges[intersectingIndices[0]].includes(intersectingIndices[1])) {
                //edge = `${circleAChar} -> ${circleBChar}`
                tmp_edges[intersectingIndices[1]].push(intersectingIndices[0]);
            }
            setMyEdges(tmp_edges);

        } else { // Start at B going to A
            edge = `${circleAChar} -> ${circleBChar}`
            start = circleA
            end = circleB
            let tmp_edges = {...myEdges};
            console.log(tmp_edges);
            if (!tmp_edges[intersectingIndices[0]].includes(intersectingIndices[1])) {
                tmp_edges[intersectingIndices[0]].push(intersectingIndices[1]);
                //edge = `${circleAChar} -> ${circleBChar}`
            }
            setMyEdges(tmp_edges);

            // tmp_edges[intersectingIndices[1]].push(intersectingIndices[0]);
            // setMyEdges(tmp_edges);

            //edge = `${circleAChar} -> ${circleBChar}`
        }

        if (edges[edge]) {
            console.log('Edge Already Exists')
            return false;
        }
        console.log(myEdges);

        // if (edges[edge]) {
        //     console.log('Edge Already Exists')
        //     return;
        // }
        // Draw the edge
        // let line = new paper.Path.Line([circleA.position._x, circleA.position._y], [circleB.position._x, circleB.position._y]);
        // line.strokeColor = 'black';
        let arrow = new Arrow(new paper.Point([start.position._x, start.position._y]))
        arrow.draw(new paper.Point([end.position._x, end.position._y]))

        // Update our local track of edges, which will in turn update global
        // setEdges({
        //     ...edges,
        //     [edge]: true
        // })
    }

    const clearSketch = () => {
        paper?.project?.activeLayer?.removeChildren();
        paper?.view?.draw();
        // Remove all edges and nodes
        setNodes([]);
        setMyEdges([]);

    }


    // On init set up our paperjs
    useEffect(() => {
        paper.setup(sketchPanelId);
        let tool = new paper.Tool();

        let currentPath;

        tool.onMouseDown = function (event) {
            currentPath = new paper.Path();
            currentPath.strokeColor = 'black';
            currentPath.add(event.point);
        }

        tool.onMouseDrag = function (event) {
            currentPath.add(event.point);
        }

        tool.onMouseUp = function (event) {
            setPath(currentPath);
        }
    }, []);

    // Check if our path is node or edge
    useEffect(() => {
        if (path) {
            isLine(path) || isCircle(path);
            path?.remove()
        }
        console.log('Added a new path')
    }, [path])

    // Update global motif tracker
    useEffect(() => {
        if (myEdges) {
            console.log(myEdges);
            context.actions.changeMotifQuery(myEdges);
        }

    }, [myEdges])


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