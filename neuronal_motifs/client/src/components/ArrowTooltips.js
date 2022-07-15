import * as React from "react";

function ArrowTooltips(props) {
  let distances = props.props;
  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 20,
        zIndex: 100,
        backgroundColor: "rgb(224,218,218)",
        opacity: 0.7,
        borderRadius: "8px",
        paddingLeft: "10px",
        paddingRight: "10px",
      }}
    >
      {distances.pre_soma_dist > 0 ? (
        <p>Distance to pre-synaptic soma is {distances.pre_soma_dist} nm</p>
      ) : (
        <p>Pre-synaptic soma not in dataset</p>
      )}
      {distances.post_soma_dist > 0 ? (
        <p>Distance to post-synaptic soma is {distances.post_soma_dist} nm</p>
      ) : (
        <p>Post-synaptic soma not in dataset</p>
      )}
    </div>
  );
}

export default ArrowTooltips;
