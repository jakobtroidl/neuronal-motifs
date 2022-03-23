import React, {useState, useEffect, useContext} from 'react';
import './SketchPanel.css'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faUpDownLeftRight, faEraser} from "@fortawesome/free-solid-svg-icons";
import paper from 'paper'
import {std, mean, distance} from 'mathjs'
import {AppContext} from "../contexts/AbstractionLevelContext";


function SketchPanel() {

    const sketchPanelId = "sketch-panel";
    let [path, setPath] = useState();
    let [circles, setCircles] = useState([])
    let [edges, setEdges] = useState({});
    const context = useContext(AppContext);


    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    const isCircle = (p) => {
        let points = p?.segments.map(segment => {
            return [segment.point._x, segment.point._y]
        })
        let pointMean = mean(points, 0)
        let pointDistances = points.map(e => distance(e, pointMean))

        let distancesMean = mean(pointDistances);
        let distancesStd = std(pointDistances);
        if ((distancesMean / distancesStd) > 3.5) {
            let circle = new paper.Path.Circle(pointMean, distancesMean)
            circle.strokeColor = 'black';
            circle.fillColor = getRandomColor();
            setCircles(circles => [...circles, circle]);
            return true;
        }

    }

    const isLine = (p) => {
        let intersections = circles.map(e => {
            let intersect = e.getIntersections(p);
            return intersect && intersect.length > 0;
        })
        let intersectingIndices = [...intersections.keys()].filter(i => intersections[i]) || [];
        if (intersectingIndices.length !== 2) {
            return
        }
        let circleA = circles[intersectingIndices[0]];
        let circleB = circles[intersectingIndices[1]];
        let startingPoint = [p.segments[0].point._x, p.segments[0].point._y];
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
            return;
        }
        let line = new paper.Path.Line([circleA.position._x, circleA.position._y], [circleB.position._x, circleB.position._y]);
        line.strokeColor = 'black';

        setEdges({
            ...edges,
            [edge]: true
        })
    }

    const clearSketch = () => {
        console.log('clear');
        paper?.project?.activeLayer?.removeChildren();
        paper?.view?.draw();

    }

// Global context holds abstraction state

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

    useEffect(() => {
        if (path) {
            isCircle(path) || isLine(path);
            path?.remove()
        }
        console.log('Added a new path')
    }, [path])

    useEffect(() => {
        if (edges) {
            context.actions.changeMotifQuery(edges);
        }

    }, [edges])


    return (
        <canvas id={sketchPanelId}></canvas>
    );

}

export default SketchPanel;