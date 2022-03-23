import React, {useState, useEffect, useContext} from 'react';
import './SketchPanel.css'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUpDownLeftRight, faEraser} from "@fortawesome/free-solid-svg-icons";
import paper from 'paper'
import {std, mean, distance} from 'mathjs'
import {AppContext} from "../contexts/AbstractionLevelContext";


function SketchPanel() {

    const sketchPanelId = "sketch-panel";
    // Keeps track of the most recent thing drawn
    let [path, setPath] = useState();

    let [nodes, setNodes] = useState([])
    let [edges, setEdges] = useState({});

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
            let label = new paper.PointText(pointMean);

            let labelLetter = String.fromCharCode(65 + (numNodes))
            setNodes(nodes => [...nodes, circle]);
            label.content = labelLetter;
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
        // Start at A, going to B
        let edge;
        let circleAChar = String.fromCharCode(65 + intersectingIndices[0])
        let circleBChar = String.fromCharCode(65 + intersectingIndices[1])
        if (distanceToCircleA < distanceToCircleB) {
            edge = `${circleAChar} -> ${circleBChar}`
        } else { // Start at B going to A
            edge = `${circleAChar} -> ${circleBChar}`
        }

        if (edges[edge]) {
            console.log('Edge Already Exists')
            return false;
        }
        // Draw the edge
        let line = new paper.Path.Line([circleA.position._x, circleA.position._y], [circleB.position._x, circleB.position._y]);
        line.strokeColor = 'black';

        // Update our local track of edges, which will in turn update global
        setEdges({
            ...edges,
            [edge]: true
        })
        return true;
    }

    const clearSketch = () => {
        paper?.project?.activeLayer?.removeChildren();
        paper?.view?.draw();
        // Remove all edges and nodes
        setNodes([]);
        setEdges({});

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
        if (edges) {
            context.actions.changeMotifQuery(edges);
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