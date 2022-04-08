import React, {useState, useEffect, useContext} from 'react';
import './SketchPanel.css'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
// import {faUpDownLeftRight, faEraser, } from "@fortawesome/free-solid-svg-icons";
import CircleTwoToneIcon from '@mui/icons-material/CircleTwoTone';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import PanToolIcon from '@mui/icons-material/PanTool';
import DeleteIcon from '@mui/icons-material/Delete';
import paper from 'paper'
import {std, mean, distance} from 'mathjs'
import {AppContext} from "../contexts/GlobalContext";
import {getRandomColor} from "../utils/rendering";
import _ from 'lodash';
import {Grid, IconButton, Tooltip} from '@mui/material';

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
    let [nodes, setNodes] = useState([])
    let [edges, setEdges] = useState([])
    let [mouseState, setMouseState] = useState('node');
    let [pencil, setPencil] = useState();
    let circleRadius = 20;
    let currentPath;
    let currentNode;
    // We track the overall motif in the global context
    const context = useContext(AppContext);

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
        currentPath = null;
        console.log('rebinding', nodes);
        pencil.onMouseMove = function (event) {
            let point = new paper.Point(event.point);
            if (mouseState === 'node') {
                let numNodes = nodes?.length || 0;
                let color = numNodes <= context.colors.length ? context.colors[numNodes] : '#000000';
                if (!currentPath) {
                    currentPath = new paper.Path.Circle(point, circleRadius);
                    currentPath.strokeColor = '#000000';
                    currentPath.strokeWidth = 3;
                    currentPath.fillColor = color;
                    currentPath.opacity = 0.5;
                } else {
                    currentPath.position = point;
                }
            } else if (mouseState = 'edge') {
                if (!currentPath) {
                    currentPath = new paper.Path();
                    currentPath.strokeColor = '#000000';
                    currentPath.strokeWidth = 3
                    currentPath.opacity = 0.5;
                    currentPath.add([point.x - 10, point.y]);
                    currentPath.add([point.x + 10, point.y]);
                }
                let intersections = _.findLastIndex(nodes.map(n => {
                    return n.contains(event.point)
                }), e => e === true);
                if (intersections === -1 && currentNode) {
                    currentPath.segments[0].point = currentNode.getNearestPoint(point);
                    currentPath.segments[1].point = point;
                } else if (intersections !== -1 && currentNode && currentNode !== nodes[intersections]) {
                    currentPath.segments[0].point = currentNode.getNearestPoint(nodes[intersections].position);
                    currentPath.segments[1].point = nodes[intersections].getNearestPoint(currentNode.position);
                } else {
                    currentPath.segments[0].point = new paper.Point([point.x - 10, point.y]);
                    currentPath.segments[1].point = new paper.Point([point.x + 10, point.y]);
                }
            }

        }
        pencil.onMouseDown = function (event) {
            let point = new paper.Point(event.point);
            if (mouseState === 'node') {
                if (!currentPath) return;
                let numNodes = nodes?.length || 0;
                let circle = currentPath.clone();
                circle.opacity = 1;
                let textPoint = [circle.position.x, circle.position.y - circleRadius - 3]
                let label = new paper.PointText({
                    point: textPoint,
                    justification: 'center',
                    fontSize: 20
                });
                let labelLetter = String.fromCharCode(65 + numNodes);
                label.content = labelLetter;
                currentPath?.remove();
                currentPath = null;
                setNodes(nodes => [...nodes, circle]);
            } else if (mouseState == 'edge') {
                let intersections = _.findLastIndex(nodes.map(n => {
                    return n.contains(event.point)
                }), e => e === true);
                if (intersections !== -1 && !currentNode) {
                    currentNode = nodes[intersections]
                    currentPath.segments[0].position = (currentNode.getNearestPoint(point));
                    return;
                } else if (currentPath && intersections !== -1) {
                    if (currentNode !== nodes[intersections]) {
                        currentPath.segments[0].point = currentNode.getNearestPoint(nodes[intersections].position)
                        currentPath.segments[1].point = nodes[intersections].getNearestPoint(currentNode.position);
                        let edge = currentPath.clone();
                        edge.opacity = 1;
                        addEdge(currentNode, nodes[intersections], edge);

                    }
                }
                currentPath?.remove();
                currentNode = null;
                currentPath = null;
            }
        }
        pencil.onMouseUp = function (event) {
        }
    }

    const addEdge = ((fromNode, toNode, edgeLine) => {
        let indices = [nodes.indexOf(fromNode), nodes.indexOf(toNode)];
        let edgeObj = {'indices': indices, 'toNode': toNode, 'fromNode': fromNode, 'edgeLine': edgeLine}
        let matchingEdge = _.findIndex(edges, (e) => {
            return _.isEqual(e.indices, indices);
        })
        console.log('matching edge', matchingEdge);
        if (matchingEdge !== -1) {
            edgeLine.remove();
        } else {
            let thirtyDegreesRadians = 30 * (Math.PI / 180);
            let toPoint = edgeLine.segments[0].point;
            let fromPoint = edgeLine.segments[1].point;
            const dy = toPoint.y - fromPoint.y;
            const dx = toPoint.x - fromPoint.x;
            const slope = (dy / dx);
            const theta = Math.atan2(dy, dx); // range (-PI, PI]
            const newY = (10 * Math.sin(theta)) + fromPoint.y;
            const newX = (10 * Math.cos(theta)) + fromPoint.x;
            let circle = new paper.Path.Circle([newX, newY], 10)
            let secondCircle = new paper.Path.Circle(circle.getNearestPoint(toPoint), 10)
            let intersections = secondCircle.getIntersections(circle).map(intersection => {
                let secondCircle = new paper.Path.Circle(intersection.point, 1)
                secondCircle.strokeColor = '#A9A9A9';
                secondCircle.strokeWidth = 1;
                secondCircle.fillColor = 'blue';
                return intersection.point
            })
            // Draw Triangle
            // var triangle = new paper.Path.RegularPolygon(new Point(80, 70), 3, 50);

            secondCircle?.remove();
            circle?.remove();


            setEdges([...edges, edgeObj])
        }

    })

    // const bindPencilEvents = () => {
    //     let mouseCircle, currentPath;
    //     let drawingCircle, drawingLine = false;
    //
    //     console.log('rebinding', nodes);
    //     pencil.onMouseDown = function (event) {
    //         console.log('down', nodes);
    //         let intersections = _.findLastIndex(nodes.map(n => {
    //             return n.contains(event.point)
    //         }), e => e === true);
    //         console.log(intersections);
    //         if (intersections !== -1) {
    //             drawingLine = [nodes[intersections]];
    //         }
    //         currentPath = new paper.Path();
    //         currentPath.strokeColor = '#A9A9A9';
    //         currentPath.strokeWidth = 3
    //         currentPath.add(event.point);
    //         mouseCircle = new paper.Path.Circle(event.point, 7);
    //         mouseCircle.strokeColor = '#f41f23';
    //     }
    //     pencil.onMouseDrag = function (event) {
    //         let point = new paper.Point(event.point);
    //         mouseCircle.position = point;
    //         console.log('dragging', drawingCircle);
    //         if (drawingLine) {
    //             if (drawingLine.length === 2) return
    //             if (currentPath.segments?.length === 1) {
    //                 currentPath.add(point);
    //             } else {
    //                 currentPath.segments[1].point = point;
    //             }
    //             currentPath.segments[0].point = drawingLine[0].getNearestPoint(event.point);
    //             let intersections = _.findLastIndex(nodes.map(n => {
    //                 return n.contains(event.point)
    //             }), e => e === true);
    //             if (intersections !== -1 && nodes[intersections] !== drawingLine[0]) {
    //                 drawingLine.push(nodes[intersections]);
    //                 currentPath.segments[1].point = drawingLine[1].getNearestPoint(drawingLine[0].position);
    //             }
    //             return;
    //         }
    //         if (drawingCircle) return;
    //         currentPath.add(event.point);
    //         if (currentPath.segments?.length > 15 && currentPath.segments[0].point.getDistance(event.point) < 10) {
    //             drawingCircle = true;
    //             mouseCircle.strokeColor = null;
    //             currentPath.add(currentPath.segments[0].point);
    //             let circle = drawCircle(currentPath);
    //             currentPath?.remove();
    //             currentPath = circle;
    //         }
    //         currentPath.smooth({type: 'continuous'});
    //     }
    //     pencil.onMouseUp = function (event) {
    //         if (drawingLine?.length === 2) {
    //
    //         } else if (drawingCircle) {
    //             let circle = currentPath.clone();
    //             circle.strokeColor = '#1C1C1CFF'
    //             circle.strokeWidth = 1;
    //             setNodes(nodes => [...nodes, circle]);
    //             let tmp_edges = [...edges];
    //             tmp_edges.push([]);
    //             setEdges(tmp_edges);
    //         }
    //         drawingCircle = false;
    //         currentPath?.removeSegments();
    //         currentPath?.remove();
    //         currentPath = null;
    //         mouseCircle?.remove()
    //         mouseCircle = null;
    //     }
    // }

    // const drawCircle = (path) => {
    //     let numNodes = nodes?.length || 0;
    //     let color = numNodes <= context.colors.length ? context.colors[numNodes] : '#000000';
    //     let points = path?.segments.map(segment => {
    //         return [segment.point.x, segment.point.y];
    //     })
    //     let pointMean = mean(points, 0);
    //     let distancesMean = mean(points.map(e => distance(e, pointMean)));
    //     let destinationPoints = path?.segments.map(s => {
    //         const dy = s.point.y - pointMean[1];
    //         const dx = s.point.x - pointMean[0];
    //         const theta = Math.atan2(dy, dx); // range (-PI, PI]
    //         const newY = (distancesMean * Math.sin(theta)) + pointMean[1];
    //         const newX = (distancesMean * Math.cos(theta)) + pointMean[0];
    //         return [newX, newY]
    //         // return theta;
    //     });
    //     path?.segments?.forEach((p, i, arr) => {
    //         arr[i].point.x = destinationPoints[i][0]
    //         arr[i].point.y = destinationPoints[i][1]
    //         console.log(i, p);
    //     })
    //     let circle = new paper.Path.Circle(pointMean, distancesMean)
    //     circle.strokeColor = '#A9A9A9';
    //     circle.strokeWidth = 3;
    //     circle.fillColor = color;
    //     let textPoint = [pointMean[0], pointMean[1] - distancesMean - 3]
    //     let label = new paper.PointText({
    //         point: textPoint,
    //         justification: 'center',
    //         fontSize: 20
    //     });
    //     let labelLetter = String.fromCharCode(65 + numNodes);
    //     label.content = labelLetter;
    //     return circle;
    // }
    useEffect(() => {
        if (pencil && mouseState) {
            // Rebind the pencil events whenever new nodes are drawn
            bindPencilEvents();
        }
    }, [pencil, nodes, mouseState, edges])


    // On init set up our paperjs
    useEffect(() => {
        paper.setup(sketchPanelId);
        console.log('Setting up Pencil')
        setPencil(new paper.Tool());
    }, []);


    // Update global motif tracker
    useEffect(() => {
        if (edges) {
            console.log('Edges', edges);
            //     context.setMotifQuery(edges);
        }

    }, [edges])


    return (
        <div className='sketch-panel-style'>
            <Grid container className="canvas-wrapper" spacing={0}>
                <Grid item xs={11}>
                    <div className="sketch-canvas">
                        <canvas id={sketchPanelId}></canvas>
                    </div>
                </Grid>
                <Grid item xs={1}>
                    <Grid
                        container
                        direction="column"
                        style={{position: 'absolute', height: 'auto', width: 'auto'}}>
                        <Tooltip title="Draw Node" placement="right">
                            <IconButton value='node' color={mouseState === 'node' ? "primary" : "default"}
                                        onClick={() => {
                                            currentPath?.remove();
                                            setMouseState('node')
                                        }}>
                                <CircleTwoToneIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Draw Edge" placement="right">
                            <IconButton color={mouseState === 'edge' ? "primary" : "default"}
                                        onClick={() => {
                                            currentPath?.remove();
                                            setMouseState('edge')
                                        }}>
                                <ArrowRightAltIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Move Node" placement="right">
                            <IconButton color={mouseState === 'move' ? "primary" : "default"}
                                        onClick={() => {
                                            currentPath?.remove();
                                            setMouseState('move')
                                        }}>
                                <PanToolIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Element" placement="right">
                            <IconButton color={mouseState === 'delete' ? "primary" : "default"}
                                        onClick={() => {
                                            currentPath?.remove();
                                            setMouseState('delete')
                                        }}>
                                <DeleteIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    </Grid>
                </Grid>
            </Grid>
            <div>

            </div>
        </div>
    )
}

export default SketchPanel;