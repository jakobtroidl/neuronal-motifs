import React, {useState, useEffect, useContext} from 'react';
import './SketchPanel.css'
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
// import {faUpDownLeftRight, faEraser, } from "@fortawesome/free-solid-svg-icons";
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
    let [open, setOpen] = React.useState(true);
    const [popperLocation, setPopperLocation] = React.useState({top: 0, left: 0})
    let circleRadius = 20;
    let currentPath;
    let currentNode;
    let selected;
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
        console.log('rebinding', nodes);
        // Deselect Everything
        paper.project.activeLayer.selected = false;
        pencil.onMouseMove = function (event) {
            let point = new paper.Point(event.point);
            testCircle.position = point;
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
            } else if (mouseState === 'edge') {
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
            } else if (mouseState === 'edit') {
                // Check with intersections with nodes
                paper.project.activeLayer.selected = false;
                let intersections = _.findLastIndex(nodes.map(n => {
                    return n.contains(event.point)
                }), e => e === true);
                if (intersections !== -1) {
                    selected = nodes[intersections];
                    nodes[intersections].selected = true;
                    return;
                }
                // Check with intersections with edges
                intersections = _.findLastIndex(edges.map(e => {
                    return !_.isEmpty(testCircle?.getIntersections(e.edgeLine));
                }), e => e === true);
                if (intersections !== -1) {
                    selected = edges[intersections]
                    edges[intersections].lineGroup.selected = true;
                }
                // Deselect Everything


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
                if (currentNode) currentNode.selected = false;
                currentNode = null;
                currentPath = null;
            } else if (mouseState == 'edit') {
                console.log('Selected', selected, event);
                setPopperLocation({
                    top: _.toNumber(event?.event?.clientY) + 20,
                    left: _.toNumber(event?.event?.clientX)
                })
            }
        }
        pencil.onMouseUp = function (event) {
        }
    }

    const addEdge = ((fromNode, toNode, edgeLine) => {

        let indices = [nodes.indexOf(fromNode), nodes.indexOf(toNode)];
        let edgeObj = {'indices': indices, 'toNode': toNode, 'fromNode': fromNode, 'edgeLine': edgeLine}
        let matchingEdge = _.findIndex(edges, (e) => {
            console.log('indices', indices);
            return _.isEqual(e.indices, indices);
        })
        console.log('matching edge', matchingEdge);
        if (matchingEdge !== -1) {
            edgeLine.remove();
            return;
        }
        // Checks from an edge going the opposite direction between the same two nodes
        let oppositeEdge = _.findIndex(edges, (e) => {
            return _.isEqual(e.indices, [indices[1], indices[0]]);
        })
        let toPoint = _.cloneDeep(edgeLine.segments[0].point);
        let fromPoint = _.cloneDeep(edgeLine.segments[1].point);
        let oppositeEdgeMidpoints = null;
        if (oppositeEdge !== -1) {
            let midpoint = new paper.Point([(toPoint.x + fromPoint.x) / 2, (toPoint.y + fromPoint.y) / 2])
            let circle1 = new paper.Path.Circle(midpoint, 4);
            let circle2 = new paper.Path.Circle(circle1.getIntersections(edges[oppositeEdge].edgeLine)[0].point,
                Math.sqrt(4 ** 2 + 4 ** 2));
            oppositeEdgeMidpoints = circle2.getIntersections(circle1).map(e => e.point);
            circle2.remove()
            circle1.remove();
            circle2 = null;
            circle1 = null;
            edges[oppositeEdge].edgeLine.add(edges[oppositeEdge].edgeLine.segments[1].point);
            edges[oppositeEdge].edgeLine.segments[1].point = oppositeEdgeMidpoints[0];
            edgeObj.edgeLine.add(edgeObj.edgeLine.segments[1].point);
            edgeObj.edgeLine.segments[1].point = oppositeEdgeMidpoints[1];
        }
        const dy = toPoint.y - fromPoint.y;
        const dx = toPoint.x - fromPoint.x;
        const slope = (dy / dx);
        const theta = Math.atan2(dy, dx); // range (-PI, PI]
        const newY = (10 * Math.sin(theta)) + fromPoint.y;
        const newX = (10 * Math.cos(theta)) + fromPoint.x;
        let circle = new paper.Path.Circle([newX, newY], 10)
        let secondCircle = new paper.Path.Circle(circle.getNearestPoint(toPoint), 10)
        let intersections = secondCircle.getIntersections(circle).map(intersection => intersection.point);
        intersections.splice(1, 0, fromPoint)
        let trianglePath = new paper.Path(intersections);
        trianglePath.strokeColor = 'black';
        trianglePath.strokeWidth = 3;
        trianglePath.strokeJoin = 'round';
        edgeObj['lineGroup'] = new paper.Group([trianglePath, edgeObj.edgeLine]);
        secondCircle?.remove();
        circle?.remove();
        setEdges([...edges, edgeObj])


    })

    useEffect(() => {
        if (pencil && mouseState) {
            // Rebind the pencil events whenever new nodes are drawn
            bindPencilEvents();
        }
    }, [pencil, nodes, mouseState, edges])


    // On init set up our paperjs
    useEffect(() => {
        paper.setup(sketchPanelId);
        let tempCircle = new paper.Path.Circle([0, 0], 6);
        tempCircle.fill = 'none';
        tempCircle.strokeWidth = 1;
        tempCircle.strokeColor = 'green';
        setTestCircle(tempCircle);

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
                        {popperLocation &&
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
                            <Typography sx={{p: 2}}>The content of the Popover.</Typography>
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

                        <Tooltip title="Edit Properties" placement="right">
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