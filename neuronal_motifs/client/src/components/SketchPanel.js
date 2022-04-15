import React, {useState, useEffect, useContext} from 'react';
import './SketchPanel.css'

import QueryBuilder from './QueryBuilder'
import CircleTwoToneIcon from '@mui/icons-material/CircleTwoTone';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import EditIcon from '@mui/icons-material/Edit';
import PanToolIcon from '@mui/icons-material/PanTool';
import DeleteIcon from '@mui/icons-material/Delete';
import paper from 'paper'
import {std, mean, distance} from 'mathjs'
import {AppContext} from "../contexts/GlobalContext";
import {getRandomColor} from "../utils/rendering";
import _ from 'lodash';
import {Box, Fade, Grid, IconButton, Popover, Tooltip, Typography} from '@mui/material';


function SketchPanel() {

    const sketchPanelId = "sketch-panel";
    // Keeps track of the most recent thing drawn
    let [nodes, setNodes] = useState([])
    let [edges, setEdges] = useState([])
    let [mouseState, setMouseState] = useState('node');
    let [pencil, setPencil] = useState();
    let [testCircle, setTestCircle] = useState();
    const [popperLocation, setPopperLocation] = React.useState()
    const [showPopper, setShowPopper] = React.useState(false);
    let circleRadius = 20;
    let currentPath;
    let currentNode;
    let currentSelection;
    // We track the overall motif in the global context
    const context = useContext(AppContext);


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
        pencil.onMouseMove = function (event) {
            let point = new paper.Point(event.point);
            testCircle.position = point;
            if (mouseState === 'node') {
                if (context.selectedSketchElement) context.setSelectedSketchElement(null);
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
            } else if (mouseState === 'edge') {
                if (context.selectedSketchElement) context.setSelectedSketchElement(null);
                if (!currentPath) {
                    currentPath = new paper.Path();
                    currentPath.strokeColor = '#000000';
                    currentPath.strokeWidth = 3
                    currentPath.opacity = 0.5;
                    currentPath.add([point.x - 10, point.y]);
                    currentPath.add([point.x + 10, point.y]);
                }
                let intersections = _.findLastIndex(nodes.map(n => {
                    return n.circle.contains(event.point)
                }), e => e === true);
                if (intersections === -1 && currentNode) {
                    currentPath.segments[0].point = currentNode.circle.getNearestPoint(point);
                    currentPath.segments[1].point = point;
                } else if (intersections !== -1 && currentNode && !_.isEqual(currentNode, nodes[intersections])) {
                    currentPath.segments[0].point = currentNode.circle.getNearestPoint(nodes[intersections].circle.position);
                    currentPath.segments[1].point = nodes[intersections].circle.getNearestPoint(currentNode.circle.position);
                } else {
                    currentPath.segments[0].point = new paper.Point([point.x - 10, point.y]);
                    currentPath.segments[1].point = new paper.Point([point.x + 10, point.y]);
                }
            } else if (mouseState === 'edit') {
                // Check with intersections with nodes
                let intersections = _.findLastIndex(nodes.map(n => {
                    return n.circle.contains(event.point)
                }), e => e === true);
                if (intersections !== -1) {
                    currentSelection = nodes[intersections];
                    return;
                }
                // Check with intersections with edges
                intersections = _.findLastIndex(edges.map(e => {
                    return !_.isEmpty(testCircle?.getIntersections(e.edgeLine));
                }), e => e === true);
                if (intersections !== -1) {
                    currentSelection = edges[intersections];
                    return
                }
                currentSelection = null;
            }
        }
        pencil.onMouseDown = function (event) {
            let point = new paper.Point(event.point);
            if (mouseState === 'node') {
                if (!currentPath) return;
                let numNodes = nodes?.length || 0;
                let circle = currentPath.clone();
                circle.opacity = 1;
                let textPoint = [circle.position.x, circle.position.y + 7]
                let label = new paper.PointText({
                    point: textPoint,
                    justification: 'center',
                    fillColor: 'white',
                    font: "Roboto",
                    fontSize: 20
                });
                let labelLetter = String.fromCharCode(65 + numNodes);
                label.content = labelLetter;
                currentPath?.remove();
                currentPath = null;
                setNodes(nodes => [...nodes, {circle: circle, label: labelLetter, properties: null, type: 'node'}]);
            } else if (mouseState == 'edge') {
                let intersections = _.findLastIndex(nodes.map(n => {
                    return n.circle.contains(event.point)
                }), e => e === true);
                if (intersections !== -1 && !currentNode) {
                    currentNode = nodes[intersections]
                    currentPath.segments[0].position = (currentNode.circle.getNearestPoint(point));
                    return;
                } else if (currentPath && intersections !== -1) {
                    if (!_.isEqual(currentNode, nodes[intersections])) {
                        currentPath.segments[0].point = currentNode.circle.getNearestPoint(nodes[intersections].circle.position)
                        currentPath.segments[1].point = nodes[intersections].circle.getNearestPoint(currentNode.circle.position);
                        let edge = currentPath.clone();
                        edge.opacity = 1;
                        addEdge(currentNode, nodes[intersections], edge);

                    }
                }
                currentPath?.remove();
                currentNode = null;
                currentPath = null;
            } else if (mouseState == 'edit') {

                let nodeIntersections = _.findLastIndex(nodes.map(n => {
                    return n.circle.contains(event.point)
                }), e => e === true);

                let edgeIntersections = _.findLastIndex(edges.map(e => {
                    return !_.isEmpty(testCircle?.getIntersections(e.edgeLine));
                }), e => e === true);

                if (nodeIntersections !== -1 || edgeIntersections !== -1) {
                    context.setSelectedSketchElement(currentSelection);
                    let selectedElement = (currentSelection?.lineGroup || currentSelection?.circle)
                    paper.project.activeLayer.selected = false;
                    selectedElement.selected = true;
                    setShowPopper(true);

                } else {
                    setShowPopper(false);
                    context.setSelectedSketchElement(null);
                    setPopperLocation(null);
                }
            }
        }
        pencil.onMouseUp = function (event) {
        }
    }
    const addEdge = ((fromNode, toNode, edgeLine) => {

        let indices = [_.findLastIndex(nodes, fromNode), _.findLastIndex(nodes, toNode)];
        let edgeObj = {'indices': indices, 'toNode': toNode, 'fromNode': fromNode, 'edgeLine': edgeLine}
        let matchingEdge = _.findIndex(edges, (e) => {
            return _.isEqual(e.indices, indices);
        })
        if (matchingEdge !== -1) {
            edgeLine.remove();
            return;
        }
        // Checks from an edge going the opposite direction between the same two nodes
        let oppositeEdge = _.findIndex(edges, (e) => {
            return _.isEqual(e.indices, [indices[1], indices[0]]);
        })
        let origToPoint = _.cloneDeep(edgeLine.segments[0].point);
        let testCircle = new paper.Path.Circle(origToPoint, 8);
        testCircle.remove()
        let toPoint = edgeLine.segments[0].point = testCircle.getIntersections(edgeLine)[0].point;
        let origFromPoint = _.cloneDeep(edgeLine.segments[1].point);
        testCircle = new paper.Path.Circle(origFromPoint, 8);
        testCircle.remove()
        let fromPoint = edgeLine.segments[1].point = testCircle.getIntersections(edgeLine)[0].point;
        const dy = toPoint.y - fromPoint.y;
        const dx = toPoint.x - fromPoint.x;
        const theta = Math.atan2(dy, dx); // range (-PI, PI]
        const newY = (7 * Math.sin(theta)) + fromPoint.y;
        const newX = (7 * Math.cos(theta)) + fromPoint.x;
        let circle = new paper.Path.Circle([newX, newY], 7)
        let secondCircle = new paper.Path.Circle(circle.getNearestPoint(toPoint), 7)
        let intersections = secondCircle.getIntersections(circle).map(intersection => intersection.point);
        intersections.splice(1, 0, fromPoint)
        let trianglePath = new paper.Path(intersections);
        trianglePath.strokeColor = 'black';
        trianglePath.strokeWidth = 3;
        trianglePath.strokeJoin = 'round';
        edgeObj['lineGroup'] = new paper.Group([trianglePath, edgeObj.edgeLine]);
        secondCircle?.remove();
        circle?.remove();
        // If edges go in opposite directions, shift them to be parallel and distinguishable
        if (oppositeEdge !== -1) {
            let midpoint = new paper.Point([(toPoint.x + fromPoint.x) / 2, (toPoint.y + fromPoint.y) / 2])
            let circle1 = new paper.Path.Circle(midpoint, 5);
            let circle2 = new paper.Path.Circle(circle1.getIntersections(edges[oppositeEdge].edgeLine)[0].point,
                Math.sqrt(5 ** 2 + 5 ** 2));
            let pointDelta = circle2.getIntersections(circle1).map(e => e.point).sort((a, b) => {
                return a.y - b.y;
            }).map(pt => new paper.Point([midpoint.x - pt.x, midpoint.y - pt.y]))
            edgeObj['lineGroup'].translate(pointDelta[0]);
            edges[oppositeEdge]['lineGroup'].translate(pointDelta[1]);
        }
        edgeObj['type'] = 'edge';
        edgeObj['label'] = `${edgeObj.fromNode.label} -> ${edgeObj.toNode.label}`
        setEdges([...edges, edgeObj])


    })
    useEffect(() => {
        if (pencil && mouseState) {
            // Rebind the pencil events whenever new nodes are drawn
            bindPencilEvents();
        }
    }, [pencil, mouseState, nodes, edges])
    useEffect(() => {
        setPopperLocation(null);
        setShowPopper(false);
        if (paper?.project?.activeLayer) {
            paper.project.activeLayer.selected = false;
        }

    }, [mouseState])
    useEffect(() => {
        if (context.selectedSketchElement) {
            let paperElement = context.selectedSketchElement?.circle || context?.selectedSketchElement?.edgeLine;
            let position = paperElement.getPosition();
            let boundingRect = paper.view.element.getBoundingClientRect();
            if (paperElement && position) {
                setPopperLocation({
                    top: position.y + boundingRect.top + 30,
                    left: position.x + boundingRect.left - 30
                })
            }
            if (context.selectedSketchElement.type === 'edge') {
                setEdges(edges.map(e => {
                    if (_.isEqual(e.edgeLine, context.selectedSketchElement.edgeLine)) {
                        e.tree = context.selectedSketchElement.tree;
                        e.query = context.selectedSketchElement.query;
                    }
                    return e
                }));
            } else {
                setNodes(nodes.map(n => {
                    if (_.isEqual(n.circle, context.selectedSketchElement.circle)) {
                        n.tree = context.selectedSketchElement.tree;
                        n.query = context.selectedSketchElement.query;
                    }
                    return n
                }));
            }
        } else {
            setPopperLocation(null);
        }
    }, [context.selectedSketchElement])
    // On init set up our paperjs
    useEffect(() => {
        paper.setup(sketchPanelId);
        let tempCircle = new paper.Path.Circle([0, 0], 6);
        tempCircle.fill = 'none';
        tempCircle.strokeWidth = 1;
        tempCircle.strokeColor = 'green';
        setTestCircle(tempCircle);
        setPencil(new paper.Tool());
    }, []);
    // Update global motif tracker
    useEffect(() => {
        if (edges) {
            console.log('Edges', edges);
        }

    }, [edges])

    return (
        <div className='sketch-panel-style'>
            <Grid container className="canvas-wrapper" spacing={0}>
                <Grid item xs={11}>
                    <div className="sketch-canvas">
                        <canvas id={sketchPanelId}></canvas>
                        {showPopper && popperLocation && context.selectedSketchElement &&
                        < Popover
                            anchorReference="anchorPosition"
                            open={true}
                            hideBackdrop={true}
                            className={'sketch-popover'}
                            disableEnforceFocus={true}
                            anchorPosition={popperLocation}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'left',
                            }}
                        >
                            <Grid
                                container
                                direction="column"
                                justifyContent="center"
                                alignItems="flex-start"
                                style={{position: 'absolute', height: '40.75px'}}
                            >
                                    <span style={{paddingLeft: 10, fontWeight: 'bold', color: '#454545'}}>
                                        {_.capitalize(context.selectedSketchElement.type)} {context.selectedSketchElement.label}
                                    </span>

                            </Grid>

                            <QueryBuilder/>
                        </Popover>
                        }
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
                        {/*<Tooltip title="Move Node" placement="right">*/}
                        {/*    <IconButton color={mouseState === 'move' ? "primary" : "default"}*/}
                        {/*                onClick={() => {*/}
                        {/*                    currentPath?.remove();*/}
                        {/*                    setMouseState('move')*/}
                        {/*                }}>*/}
                        {/*        <PanToolIcon fontSize="small"/>*/}
                        {/*    </IconButton>*/}
                        {/*</Tooltip>*/}
                        <Tooltip title="Clear Sketch" placement="right">
                            <IconButton color="default"
                                        onClick={clearSketch}>
                                <DeleteIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Select" placement="right">
                            <IconButton value='edit' color={mouseState === 'edit' ? "primary" : "default"}
                                        onClick={() => {
                                            currentPath?.remove();
                                            setMouseState('edit');
                                        }}>
                                <EditIcon fontSize="small"/>
                            </IconButton>
                        </Tooltip>
                    </Grid>
                </Grid>
            </Grid>


        </div>
    )
}

export default SketchPanel;