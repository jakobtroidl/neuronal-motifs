/**
 * Write fragment depth of particles to texture
 */
const ParticleShader = {
  uniforms: {
    particleScale: { value: 1.0 }, // particle scale
    sphereTexture: { value: null }, // texture containing the sphere imposter
    color: { value: null },
    abstraction_threshold: { value: 0.0 }, // 'abstraction_threshold
    grey_out: { value: 0 },
  },

  vertexShader: /* glsl */ `
	
    	uniform float particleScale;
    	
        attribute float radius;
        // attribute vec3 typeColor;
        attribute float label;
        
        varying float vLabel;
        varying vec4 mvPosition;
        varying float vRadius;
        
        void main()
        {
            vLabel = label ;
            mvPosition = modelViewMatrix * vec4(position, 1.0);
        
            gl_PointSize = radius * ((particleScale*2.0) / length(mvPosition.z));
            gl_Position = projectionMatrix * mvPosition;
            vRadius = radius;
        }
`,

  fragmentShader: /* glsl */ `
	
		uniform sampler2D sphereTexture; // Imposter image of sphere
		uniform float abstraction_threshold;
		uniform int grey_out;
		uniform vec3 color;
        
        varying float vLabel;
        varying vec4 mvPosition;
        varying float vRadius;
        
        void main()
        {
            vec2 uv = vec2(gl_PointCoord.x, 1.0 - gl_PointCoord.y);
            vec4 sphereColors = texture2D(sphereTexture, uv);
            if (sphereColors.a < 0.3 || vLabel > abstraction_threshold) discard;
            
            vec3 myColor = color;
            if (grey_out > 0 && vLabel > 0.0)
            {
				myColor = vec3(0.75, 0.75, 0.75);
            }
            
            vec3 baseColor = myColor * sphereColors.r;
            vec3 highlightColor = baseColor + sphereColors.ggg;
            gl_FragColor = vec4(highlightColor, sphereColors.a);
        }
	`,
};

export { ParticleShader };
