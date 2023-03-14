/**
 * Write fragment depth of particles to texture
 */
const ParticleDepthShader = {

	uniforms: {
		'mNear': { value: 1.0 }, // near clipping plane
		'mFar': { value: 1000.0 }, // far clipping plane
        'particleScale': { value: 1.0 }, // particle scale
		'sphereTexture': { value: null } // texture containing the sphere
	},

	vertexShader: /* glsl */`
	
    	uniform float particleScale;
        attribute float radius;
        varying vec4 mvPosition;
        
        void main()
        {
            mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = radius * ((particleScale*2.0) / length(mvPosition.z));
            gl_Position = projectionMatrix * mvPosition;
        }
`,

	fragmentShader: /* glsl */`
	
		uniform float mNear;
		uniform float mFar;
		uniform sampler2D sphereTexture;
	
        varying vec4 mvPosition;
        
        void main()
        {   
        	// render points as circles instead of squares
        	vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
    		vec4 sphereColors = texture2D(sphereTexture, uv);
    		if (sphereColors.a < 0.3) discard; // discard the corners of the square
     
     		// write fragment depth
            float depth = 1.0 - smoothstep(mNear, mFar, -mvPosition.z);
            gl_FragColor = vec4(vec3(depth), 1.0);
        }
	`

};

export { ParticleDepthShader };