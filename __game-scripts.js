var AugmentedRealityManager=pc.createScript("augmentedRealityManager");AugmentedRealityManager.attributes.add("spaceType",{type:"string",description:"Reference space type. Can be one of the following:\n        XRSPACE_VIEWER: Viewer - always supported space with some basic tracking capabilities;\n        RSPACE_LOCAL: Local - represents a tracking space with a native origin near the viewer at the time of creation. It is meant for seated or basic local XR sessions;\n        XRSPACE_LOCALFLOOR: Local Floor - represents a tracking space with a native origin at the floor in a safe position for the user to stand. The y axis equals 0 at floor level. Floor level value might be estimated by the underlying platform. It is meant for seated or basic local XR sessions;\n        XRSPACE_BOUNDEDFLOOR: Bounded Floor - represents a tracking space with its native origin at the floor, where the user is expected to move within a pre-established boundary;\n        XRSPACE_UNBOUNDED: Unbounded - represents a tracking space where the user is expected to move freely around their environment, potentially long distances from their starting point.",enum:[{XRSPACE_VIEWER:pc.XRSPACE_VIEWER},{XRSPACE_LOCAL:pc.XRSPACE_LOCAL},{XRSPACE_LOCALFLOOR:pc.XRSPACE_LOCALFLOOR},{XRSPACE_BOUNDEDFLOOR:pc.XRSPACE_BOUNDEDFLOOR},{XRSPACE_UNBOUNDED:pc.XRSPACE_UNBOUNDED}],default:pc.XRSPACE_LOCALFLOOR}),AugmentedRealityManager.attributes.add("defaultCameraEntity",{type:"entity",description:"Entity with the scene's default, non-AR Camera."}),AugmentedRealityManager.attributes.add("arCameraEntity",{type:"entity",description:"Entity with a Camera component attached which is to be used for AR."}),AugmentedRealityManager.attributes.add("useInput",{type:"boolean",description:"If set to true, listen to available device inputs for interacting with 3D scene objects (such as tapping on a phone).",default:!0}),AugmentedRealityManager.attributes.add("useLightEstimation",{type:"boolean",description:"If set to true and available on device, use the LightEstimation API.",default:!0}),AugmentedRealityManager.attributes.add("useHitTest",{type:"boolean",description:"If set to true and available on device, use the HitTest API for placement of 3D objects on real-world geometry.",default:!0}),AugmentedRealityManager.prototype.initialize=function(){this.defaultCameraEntity&&this.defaultCameraEntity.camera?this.arCameraEntity&&this.arCameraEntity.camera?(this.defaultCameraEntity.enabled=!0,this.arCameraEntity.enabled=!1,this._isArSupported=this.app.xr&&this.app.xr.supported&&this.app.xr.isAvailable(pc.XRTYPE_AR),this._isArSupported||console.warn("WebXR-AR is not supported in this platform."),this._registerListeners("on"),this.on("destroy",this._onDestroy,this)):console.error("AugmentedRealityManager: invalid arCameraEntity!"):console.error("AugmentedRealityManager: invalid defaultCameraEntity!")},AugmentedRealityManager.prototype.postInitialize=function(){this._onXrAvailabilityUpdate()},AugmentedRealityManager.prototype._onDestroy=function(){this._registerListeners("off")},AugmentedRealityManager.prototype._registerListeners=function(t){this._isArSupported&&(this.app[t]("ar:request:start",this._startAugmentedRealitySession,this),this.app[t]("ar:request:end",this._endAugmentedRealitySession,this),this.app.xr[t]("start",this._onXrStart,this),this.app.xr[t]("end",this._onXrEnd,this),this.app.xr[t]("available:"+pc.XRTYPE_AR,this._onXrAvailabilityUpdate,this),this.app.xr[t]("error",this._onXrError,this),this.app.xr.lightEstimation&&this.app.xr.lightEstimation.supported&&(this.app.xr.lightEstimation[t]("available",this._onXrLightEstimationAvailable,this),this.app.xr.lightEstimation[t]("error",this._onXrLightEstimationError))),this.useInput&&(this.app.keyboard[t]("keydown",this._onKeyDown,this),this._isArSupported&&this.app.xr.input&&(this.app.xr.input[t]("selectstart",this._onXrInputSelectStart,this),this.app.xr.input[t]("selectend",this._onXrInputSelectEnd,this)),this.app.mouse&&(this.app.mouse[t](pc.EVENT_MOUSEDOWN,this._onMouseDown,this),this.app.mouse[t](pc.EVENT_MOUSEUP,this._onMouseUp,this)),this.app.touch&&(this.app.touch[t](pc.EVENT_TOUCHSTART,this._onTouchStart,this),this.app.touch[t](pc.EVENT_TOUCHEND,this._onTouchEnd,this)))},AugmentedRealityManager.prototype._startAugmentedRealitySession=function(){this.defaultCameraEntity.enabled=!1,this.arCameraEntity.enabled=!0,this.arCameraEntity.camera.startXr(pc.XRTYPE_AR,this.spaceType)},AugmentedRealityManager.prototype._endAugmentedRealitySession=function(){this.app.xr.end()},AugmentedRealityManager.prototype._onXrStart=function(){if(this.app.fire("ar:onStart"),this.useLightEstimation&&this.app.xr.lightEstimation.supported&&this.app.xr.lightEstimation.start(),this.useHitTest&&this.app.xr.hitTest&&this.app.xr.hitTest.supported){const t=this;this.app.xr.hitTest.start({spaceType:pc.XRSPACE_VIEWER,callback:function(e,a){if(e)return console.error(e),void t.app.fire("ar:hit:disabled");t.app.fire("ar:hit:start"),a.on("result",(function(e,a){t.app.fire("ar:hit",e,a)}))}})}else this.app.fire("ar:hit:disabled");this.app.xr.once("update",this._onXrTracking,this)},AugmentedRealityManager.prototype._onXrTracking=function(){const t=this.arCameraEntity.camera.camera;if(t.xr&&t.xr.views.length){const e=new pc.Mat4,a=t.xr.views[0];e.copy(a.projMat);const i=e.data,n=2*Math.atan(1/i[5])*180/Math.PI,r=i[5]/i[0],s=i[14]/(i[10]+1),o=i[14]/(i[10]-1),p=this.arCameraEntity.camera;p.camera.horizontalFov=!1,p.camera.fov=n,p.camera.aspectRatio=r,p.camera.farClip=s,p.camera.nearClip=o}this.app.fire("ar:onTracking")},AugmentedRealityManager.prototype._onXrEnd=function(){this.app.fire("ar:onEnd"),this.useLightEstimation&&this.app.xr.lightEstimation.supported&&this.app.xr.lightEstimation.end(),this.app.xr.off("update",this._onXrTracking,this),this.defaultCameraEntity.enabled=!0,this.arCameraEntity.enabled=!1},AugmentedRealityManager.prototype._onXrAvailabilityUpdate=function(){this.app.fire("ar:available",this.app.xr.supported&&this.app.xr.isAvailable(pc.XRTYPE_AR))},AugmentedRealityManager.prototype._onXrError=function(t){console.error(t)},AugmentedRealityManager.prototype._onXrLightEstimationAvailable=function(){this.app.fire("ar:lightEstimation:available",this.app.xr.lightEstimation.available)},AugmentedRealityManager.prototype._onXrLightEstimationError=function(t){console.error(t)},AugmentedRealityManager.prototype._onXrInputSelectStart=function(t){this._doXrInputRaycast(t,"input:start")},AugmentedRealityManager.prototype._onXrInputSelectEnd=function(t){this._doXrInputRaycast(t,"input:end")},AugmentedRealityManager.prototype._onMouseDown=function(t){t.button===pc.MOUSEBUTTON_LEFT&&this._doScreenInputRaycast(t.x,t.y,"input:start")},AugmentedRealityManager.prototype._onMouseUp=function(t){t.button===pc.MOUSEBUTTON_LEFT&&this._doScreenInputRaycast(t.x,t.y,"input:end")},AugmentedRealityManager.prototype._onTouchStart=function(t){for(let e=0;e<t.changedTouches.length;++e)this._doScreenInputRaycast(t.changedTouches[e].x,t.changedTouches[e].y,"input:start");t.event.preventDefault()},AugmentedRealityManager.prototype._onTouchEnd=function(t){for(let e=0;e<t.changedTouches.length;++e)this._doScreenInputRaycast(t.changedTouches[e].x,t.changedTouches[e].y,"input:end");t.event.preventDefault()},AugmentedRealityManager.prototype._doXrInputRaycast=function(t,e){let a=new pc.Vec3;a.copy(t.getDirection()),a.mulScalar(this.arCameraEntity.camera.farClip),a.add(t.getOrigin()),this._doRaycastToEntity(t.getOrigin(),a,e)};let _doScreenInputRaycastVec=new pc.Vec3;AugmentedRealityManager.prototype._doScreenInputRaycast=function(t,e,a){this.defaultCameraEntity.camera.screenToWorld(t,e,this.defaultCameraEntity.camera.farClip,_doScreenInputRaycastVec),this._doRaycastToEntity(this.defaultCameraEntity.getPosition(),_doScreenInputRaycastVec,a)},AugmentedRealityManager.prototype._doRaycastToEntity=function(t,e,a){},AugmentedRealityManager.prototype._onKeyDown=function(t){t.key===pc.KEY_ESCAPE&&this._endAugmentedRealitySession()};var BtnAr=pc.createScript("btnAr");BtnAr.prototype.initialize=function(){this._registerListeners("on"),this.on("destroy",this._onDestroy,this)},BtnAr.prototype._onDestroy=function(){this._registerListeners("off")},BtnAr.prototype._registerListeners=function(t){this.entity.button[t]("click",this._onClick,this),this.app[t]("ar:available",this._onArAvailable,this),this.app[t]("ar:onStart",this._onArStart,this),this.app[t]("ar:onEnd",this._onArEnd,this)},BtnAr.prototype._onClick=function(){this._isArOn?this.app.fire("ar:request:end"):this.app.fire("ar:request:start")},BtnAr.prototype._onArAvailable=function(t){this.entity.enabled=t},BtnAr.prototype._onArStart=function(){this._isArOn=!0},BtnAr.prototype._onArEnd=function(){this._isArOn=!1};var ShadowCatcher=pc.createScript("shadowCatcher");ShadowCatcher.attributes.add("material",{type:"asset"}),ShadowCatcher.attributes.add("intensity",{type:"number",min:0,max:1,default:1}),ShadowCatcher.prototype.initialize=function(){const a=this.material.resource||material;a.setParameter("intensity",this.intensity),a.chunks.APIVersion=pc.CHUNKAPI_1_57,a.chunks.emissivePS="\n        #ifdef GL2\n        #define SHADOW_SAMPLERVS sampler2DShadow\n        #else\n        #define SHADOW_SAMPLERVS sampler2D\n        #endif\n        vec3 dEmissive;\n        uniform float intensity;\n        float getShadowPCF3x3(SHADOW_SAMPLERVS shadowMap, vec3 shadowParams);\n        vec3 getTransparentShadow() {\n            float shadow = getShadowPCF3x3(light0_shadowMap, light0_shadowParams);\n            dAlpha = (1. - clamp(shadow + 0.5, 0., 1.)) * intensity;\n            return -gl_FragColor.rgb;\n        }\n\n        void getEmission() {\n\n        }\n    ",a.chunks.endPS="\n        gl_FragColor.rgb = combineColor();\n        gl_FragColor.rgb += getTransparentShadow();\n        gl_FragColor.rgb = addFog(gl_FragColor.rgb);\n\n        #ifndef HDR\n        gl_FragColor.rgb = toneMap(gl_FragColor.rgb);\n        gl_FragColor.rgb = gammaCorrectOutput(gl_FragColor.rgb);\n        #endif\n    ",a.blendType=pc.BLEND_PREMULTIPLIED,a.update(),this.on("attr:intensity",(function(n,e){a.setParameter("intensity",n)}))};var EntityEnableOnAr=pc.createScript("entityEnableOnAr");EntityEnableOnAr.attributes.add("enableOnDefault",{type:"boolean",description:"If set to true, this Entity will be Enabled when not in AR mode.",default:!0}),EntityEnableOnAr.attributes.add("enableOnAR",{type:"string",enum:[{Disabled:"disabled"},{Always:"always"},{"On Tracking":"onTracking"}],description:"Disabled: entity will always be disabled during AR session;\n        Always: entity will always be enabled during AR session, regardless if XR is available;\n        On Tracking: entity will only be enabled after the AR session has started tracking.",default:"onTracking"}),EntityEnableOnAr.prototype.initialize=function(){this._registerListeners("on"),this.on("destroy",this._onDestroy,this)},EntityEnableOnAr.prototype.postInitialize=function(){this.entity.enabled=this.enableOnDefault},EntityEnableOnAr.prototype._onDestroy=function(){this._registerListeners("off")},EntityEnableOnAr.prototype._registerListeners=function(t){this.app[t]("ar:request:start",this._startAugmentedRealitySession,this),this.app[t]("ar:onStart",this._onArStart,this),this.app[t]("ar:onTracking",this._onArTracking,this),this.app[t]("ar:onEnd",this._onArEnd,this)},EntityEnableOnAr.prototype._startAugmentedRealitySession=function(){this.entity.enabled=!1},EntityEnableOnAr.prototype._onArStart=function(){"always"===this.enableOnAR?this.entity.enabled=!0:this.entity.enabled=!1},EntityEnableOnAr.prototype._onArTracking=function(){"onTracking"===this.enableOnAR&&(this.entity.enabled=!0)},EntityEnableOnAr.prototype._onArEnd=function(){this.enableOnDefault&&(this.entity.enabled=!0)};var EntityRotator=pc.createScript("entityRotator");EntityRotator.attributes.add("speed",{type:"number",default:15}),EntityRotator.prototype.initialize=function(){this._multiplier=0,this._registerListeners("on"),this.on("destroy",this._onDestroy,this)},EntityRotator.prototype._onDestroy=function(){this._registerListeners("off")},EntityRotator.prototype._registerListeners=function(t){this.entity[t]("rotation:set",this._rotationSet,this),this.entity[t]("input:start",this._onInputStart,this)},EntityRotator.prototype._rotationSet=function(t){this._multiplier=t},EntityRotator.prototype._onInputStart=function(){this._multiplier>0?this._multiplier=-1:this._multiplier=1},EntityRotator.prototype.update=function(t){this.entity.rotate(0,this.speed*t*this._multiplier,0)};var BtnRotator=pc.createScript("btnRotator");BtnRotator.attributes.add("targetEntity",{type:"entity"}),BtnRotator.attributes.add("speed",{type:"number",default:1}),BtnRotator.prototype.initialize=function(){this.entity.button.on("click",(function(){this.targetEntity.fire("rotation:set",this.speed)}),this)};var LightEstimationRender=pc.createScript("lightEstimationRender");LightEstimationRender.prototype.initialize=function(){this.materials=this.entity.findComponents("render").map((t=>t.material)),this.texture=new pc.Texture(this.app.graphicsDevice,{addressU:pc.ADDRESS_CLAMP_TO_EDGE,addressV:pc.ADDRESS_CLAMP_TO_EDGE,minFilter:pc.FILTER_NEAREST_MIPMAP_NEAREST,magFilter:pc.FILTER_NEAREST,format:pc.PIXELFORMAT_RGB16F,mipmaps:!1,cubemap:!0}),this._registerListeners("on"),this.on("destroy",this._onDestroy,this)},LightEstimationRender.prototype._onDestroy=function(){this._registerListeners("off")},LightEstimationRender.prototype.update=function(t){if(this.app.xr.lightEstimation.available)for(let t=0;t<this.materials.length;t++)this.materials[t].ambientSH=this.app.xr.lightEstimation.sphericalHarmonics,this.materials[t].update()},LightEstimationRender.prototype._registerListeners=function(t){this.app[t]("ar:lightEstimation:available",this._onLightEstimationAvailable,this),this.app[t]("ar:onEnd",this._onArEnd,this)},LightEstimationRender.prototype._onLightEstimationAvailable=function(){for(let t=0;t<this.materials.length;t++)this.materials[t].onUpdateShader=function(t){return t.ambientSH=!0,t},this.materials[t].update()},LightEstimationRender.prototype._onArEnd=function(){for(let t=0;t<this.materials.length;t++)this.materials[t].onUpdateShader=function(t){return t.ambientSH=!1,t},this.materials[t].ambientSH=null,this.materials[t].update()};var LightEstimationLight=pc.createScript("lightEstimationLight");LightEstimationLight.attributes.add("updateIntensity",{type:"boolean",description:"If true, the intesity of the Light component will be updated based on the estimated light intensity value.",default:!0}),LightEstimationLight.attributes.add("maxIntensity",{type:"number",description:"If updateIntensity is set, cap the light intesity to this value.",default:1,min:0,max:8}),LightEstimationLight.attributes.add("updateColor",{type:"boolean",description:"If true, the color of the Light component will be updated based on the estimated light color value.",default:!0}),LightEstimationLight.attributes.add("updateRotation",{type:"boolean",description:"If true, the rotation of the Entity will be updated based on the estimated light rotation.",default:!0}),LightEstimationLight.prototype.initialize=function(){this._startingIntensity=this.entity.light.intensity,this._startingColor=(new pc.Color).copy(this.entity.light.color),this._startingRotation=(new pc.Quat).copy(this.entity.getRotation()),this._updateLight=!1,this._registerListeners("on"),this.on("destroy",this._onDestroy,this)},LightEstimationLight.prototype._onDestroy=function(){this._registerListeners("off")},LightEstimationLight.prototype._registerListeners=function(t){this.app[t]("ar:onEnd",this._onArEnd,this)},LightEstimationLight.prototype._onArEnd=function(){this.entity.light.intensity=this._startingIntensity,this.entity.light.color=this._startingColor,this.entity.setRotation(this._startingRotation)},LightEstimationLight.prototype.update=function(t){this.app.xr.lightEstimation.available&&(this.updateIntensity&&(this.entity.light.intensity=Math.min(this.app.xr.lightEstimation.intensity,this.maxIntensity)),this.updateColor&&(this.entity.light.color=this.app.xr.lightEstimation.color),this.updateRotation&&this.entity.setRotation(this.app.xr.lightEstimation.rotation))};var TouchInput=pc.createScript("touchInput");TouchInput.attributes.add("orbitSensitivity",{type:"number",default:.4,title:"Orbit Sensitivity",description:"How fast the camera moves around the orbit. Higher is faster"}),TouchInput.attributes.add("distanceSensitivity",{type:"number",default:.2,title:"Distance Sensitivity",description:"How fast the camera moves in and out. Higher is faster"}),TouchInput.prototype.initialize=function(){this.orbitCamera=this.entity.script.orbitCamera,this.lastTouchPoint=new pc.Vec2,this.lastPinchMidPoint=new pc.Vec2,this.lastPinchDistance=0,this.orbitCamera&&this.app.touch&&(this.app.touch.on(pc.EVENT_TOUCHSTART,this.onTouchStartEndCancel,this),this.app.touch.on(pc.EVENT_TOUCHEND,this.onTouchStartEndCancel,this),this.app.touch.on(pc.EVENT_TOUCHCANCEL,this.onTouchStartEndCancel,this),this.app.touch.on(pc.EVENT_TOUCHMOVE,this.onTouchMove,this),this.on("destroy",(function(){this.app.touch.off(pc.EVENT_TOUCHSTART,this.onTouchStartEndCancel,this),this.app.touch.off(pc.EVENT_TOUCHEND,this.onTouchStartEndCancel,this),this.app.touch.off(pc.EVENT_TOUCHCANCEL,this.onTouchStartEndCancel,this),this.app.touch.off(pc.EVENT_TOUCHMOVE,this.onTouchMove,this)})))},TouchInput.prototype.getPinchDistance=function(t,i){var o=t.x-i.x,n=t.y-i.y;return Math.sqrt(o*o+n*n)},TouchInput.prototype.calcMidPoint=function(t,i,o){o.set(i.x-t.x,i.y-t.y),o.scale(.5),o.x+=t.x,o.y+=t.y},TouchInput.prototype.onTouchStartEndCancel=function(t){var i=t.touches;1==i.length?this.lastTouchPoint.set(i[0].x,i[0].y):2==i.length&&(this.lastPinchDistance=this.getPinchDistance(i[0],i[1]),this.calcMidPoint(i[0],i[1],this.lastPinchMidPoint))},TouchInput.fromWorldPoint=new pc.Vec3,TouchInput.toWorldPoint=new pc.Vec3,TouchInput.worldDiff=new pc.Vec3,TouchInput.prototype.pan=function(t){var i=TouchInput.fromWorldPoint,o=TouchInput.toWorldPoint,n=TouchInput.worldDiff,h=this.entity.camera,c=this.orbitCamera.distance;h.screenToWorld(t.x,t.y,c,i),h.screenToWorld(this.lastPinchMidPoint.x,this.lastPinchMidPoint.y,c,o),n.sub2(o,i),this.orbitCamera.pivotPoint.add(n)},TouchInput.pinchMidPoint=new pc.Vec2,TouchInput.prototype.onTouchMove=function(t){var i=TouchInput.pinchMidPoint,o=t.touches;if(1==o.length){var n=o[0];this.orbitCamera.pitch-=(n.y-this.lastTouchPoint.y)*this.orbitSensitivity,this.orbitCamera.yaw-=(n.x-this.lastTouchPoint.x)*this.orbitSensitivity,this.lastTouchPoint.set(n.x,n.y)}else if(2==o.length){var h=this.getPinchDistance(o[0],o[1]),c=h-this.lastPinchDistance;this.lastPinchDistance=h,this.orbitCamera.distance-=c*this.distanceSensitivity*.1*(.1*this.orbitCamera.distance),this.calcMidPoint(o[0],o[1],i),this.pan(i),this.lastPinchMidPoint.copy(i)}};var OrbitCamera=pc.createScript("orbitCamera");OrbitCamera.attributes.add("autoRender",{type:"boolean",default:!0,title:"Auto Render",description:"Disable to only render when camera is moving (saves power when the camera is still)"}),OrbitCamera.attributes.add("distanceMax",{type:"number",default:0,title:"Distance Max",description:"Setting this at 0 will give an infinite distance limit"}),OrbitCamera.attributes.add("distanceMin",{type:"number",default:0,title:"Distance Min"}),OrbitCamera.attributes.add("pitchAngleMax",{type:"number",default:90,title:"Pitch Angle Max (degrees)"}),OrbitCamera.attributes.add("pitchAngleMin",{type:"number",default:-90,title:"Pitch Angle Min (degrees)"}),OrbitCamera.attributes.add("inertiaFactor",{type:"number",default:0,title:"Inertia Factor",description:"Higher value means that the camera will continue moving after the user has stopped dragging. 0 is fully responsive."}),OrbitCamera.attributes.add("focusEntity",{type:"entity",title:"Focus Entity",description:"Entity for the camera to focus on. If blank, then the camera will use the whole scene"}),OrbitCamera.attributes.add("frameOnStart",{type:"boolean",default:!0,title:"Frame on Start",description:'Frames the entity or scene at the start of the application."'}),Object.defineProperty(OrbitCamera.prototype,"distance",{get:function(){return this._targetDistance},set:function(t){this._targetDistance=this._clampDistance(t)}}),Object.defineProperty(OrbitCamera.prototype,"pitch",{get:function(){return this._targetPitch},set:function(t){this._targetPitch=this._clampPitchAngle(t)}}),Object.defineProperty(OrbitCamera.prototype,"yaw",{get:function(){return this._targetYaw},set:function(t){this._targetYaw=t;var i=(this._targetYaw-this._yaw)%360;this._targetYaw=i>180?this._yaw-(360-i):i<-180?this._yaw+(360+i):this._yaw+i}}),Object.defineProperty(OrbitCamera.prototype,"pivotPoint",{get:function(){return this._pivotPoint},set:function(t){this._pivotPoint.copy(t)}}),OrbitCamera.prototype.focus=function(t){this._buildAabb(t,0);var i=this._modelsAabb.halfExtents,e=Math.max(i.x,Math.max(i.y,i.z));e/=Math.tan(.5*this.entity.camera.fov*pc.math.DEG_TO_RAD),e*=2,this.distance=e,this._removeInertia(),this._pivotPoint.copy(this._modelsAabb.center)},OrbitCamera.distanceBetween=new pc.Vec3,OrbitCamera.prototype.resetAndLookAtPoint=function(t,i){this.pivotPoint.copy(i),this.entity.setPosition(t),this.entity.lookAt(i);var e=OrbitCamera.distanceBetween;e.sub2(i,t),this.distance=e.length(),this.pivotPoint.copy(i);var a=this.entity.getRotation();this.yaw=this._calcYaw(a),this.pitch=this._calcPitch(a,this.yaw),this._removeInertia(),this._updatePosition(),this.autoRender||(this.app.renderNextFrame=!0)},OrbitCamera.prototype.resetAndLookAtEntity=function(t,i){this._buildAabb(i,0),this.resetAndLookAtPoint(t,this._modelsAabb.center)},OrbitCamera.prototype.reset=function(t,i,e){this.pitch=i,this.yaw=t,this.distance=e,this._removeInertia(),this.autoRender||(this.app.renderNextFrame=!0)},OrbitCamera.prototype.initialize=function(){this._checkAspectRatio(),this._modelsAabb=new pc.BoundingBox,this._buildAabb(this.focusEntity||this.app.root,0),this.entity.lookAt(this._modelsAabb.center),this._pivotPoint=new pc.Vec3,this._pivotPoint.copy(this._modelsAabb.center),this._lastFramePivotPoint=this._pivotPoint.clone();var t=this.entity.getRotation();if(this._yaw=this._calcYaw(t),this._pitch=this._clampPitchAngle(this._calcPitch(t,this._yaw)),this.entity.setLocalEulerAngles(this._pitch,this._yaw,0),this._distance=0,this._targetYaw=this._yaw,this._targetPitch=this._pitch,this.frameOnStart)this.focus(this.focusEntity||this.app.root);else{var i=new pc.Vec3;i.sub2(this.entity.getPosition(),this._pivotPoint),this._distance=this._clampDistance(i.length())}this._targetDistance=this._distance,this._autoRenderDefault=this.app.autoRender,this.app.autoRender&&(this.app.autoRender=this.autoRender),this.autoRender||(this.app.renderNextFrame=!0),this.on("attr:autoRender",(function(t,i){this.app.autoRender=t,this.autoRender||(this.app.renderNextFrame=!0)}),this),this.on("attr:distanceMin",(function(t,i){this._targetDistance=this._clampDistance(this._distance)}),this),this.on("attr:distanceMax",(function(t,i){this._targetDistance=this._clampDistance(this._distance)}),this),this.on("attr:pitchAngleMin",(function(t,i){this._targetPitch=this._clampPitchAngle(this._pitch)}),this),this.on("attr:pitchAngleMax",(function(t,i){this._targetPitch=this._clampPitchAngle(this._pitch)}),this),this.on("attr:focusEntity",(function(t,i){this.frameOnStart?this.focus(t||this.app.root):this.resetAndLookAtEntity(this.entity.getPosition(),t||this.app.root)}),this),this.on("attr:frameOnStart",(function(t,i){t&&this.focus(this.focusEntity||this.app.root)}),this);var onResizeCanvas=function(){this._checkAspectRatio(),this.autoRender||(this.app.renderNextFrame=!0)};this.app.graphicsDevice.on("resizecanvas",onResizeCanvas,this),this.on("destroy",(function(){this.app.graphicsDevice.off("resizecanvas",onResizeCanvas,this),this.app.autoRender=this._autoRenderDefault}),this)},OrbitCamera.prototype.update=function(t){if(!this.autoRender){var i=Math.abs(this._targetDistance-this._distance),e=Math.abs(this._targetYaw-this._yaw),a=Math.abs(this._targetPitch-this._pitch),s=this._lastFramePivotPoint.distance(this._pivotPoint);this.app.renderNextFrame=this.app.renderNextFrame||i>.01||e>.01||a>.01||s>0}var n=0===this.inertiaFactor?1:Math.min(t/this.inertiaFactor,1);this._distance=pc.math.lerp(this._distance,this._targetDistance,n),this._yaw=pc.math.lerp(this._yaw,this._targetYaw,n),this._pitch=pc.math.lerp(this._pitch,this._targetPitch,n),this._lastFramePivotPoint.copy(this._pivotPoint),this._updatePosition()},OrbitCamera.prototype._updatePosition=function(){this.entity.setLocalPosition(0,0,0),this.entity.setLocalEulerAngles(this._pitch,this._yaw,0);var t=this.entity.getPosition();t.copy(this.entity.forward),t.scale(-this._distance),t.add(this.pivotPoint),this.entity.setPosition(t)},OrbitCamera.prototype._removeInertia=function(){this._yaw=this._targetYaw,this._pitch=this._targetPitch,this._distance=this._targetDistance},OrbitCamera.prototype._checkAspectRatio=function(){var t=this.app.graphicsDevice.height,i=this.app.graphicsDevice.width;this.entity.camera.horizontalFov=t>i},OrbitCamera.prototype._buildAabb=function(t,i){var e,a=0,s=0;if(t instanceof pc.Entity){var n=[],r=t.findComponents("render");for(a=0;a<r.length;++a)if(e=r[a].meshInstances)for(s=0;s<e.length;s++)n.push(e[s]);var h=t.findComponents("model");for(a=0;a<h.length;++a)if(e=h[a].meshInstances)for(s=0;s<e.length;s++)n.push(e[s]);for(a=0;a<n.length;a++)0===i?this._modelsAabb.copy(n[a].aabb):this._modelsAabb.add(n[a].aabb),i+=1}for(a=0;a<t.children.length;++a)i+=this._buildAabb(t.children[a],i);return i},OrbitCamera.prototype._calcYaw=function(t){var i=new pc.Vec3;return t.transformVector(pc.Vec3.FORWARD,i),Math.atan2(-i.x,-i.z)*pc.math.RAD_TO_DEG},OrbitCamera.prototype._clampDistance=function(t){return this.distanceMax>0?pc.math.clamp(t,this.distanceMin,this.distanceMax):Math.max(t,this.distanceMin)},OrbitCamera.prototype._clampPitchAngle=function(t){return pc.math.clamp(t,-this.pitchAngleMax,-this.pitchAngleMin)},OrbitCamera.quatWithoutYaw=new pc.Quat,OrbitCamera.yawOffset=new pc.Quat,OrbitCamera.prototype._calcPitch=function(t,i){var e=OrbitCamera.quatWithoutYaw,a=OrbitCamera.yawOffset;a.setFromEulerAngles(0,-i,0),e.mul2(a,t);var s=new pc.Vec3;return e.transformVector(pc.Vec3.FORWARD,s),Math.atan2(s.y,-s.z)*pc.math.RAD_TO_DEG};var KeyboardInput=pc.createScript("keyboardInput");KeyboardInput.prototype.initialize=function(){this.orbitCamera=this.entity.script.orbitCamera},KeyboardInput.prototype.postInitialize=function(){this.orbitCamera&&(this.startDistance=this.orbitCamera.distance,this.startYaw=this.orbitCamera.yaw,this.startPitch=this.orbitCamera.pitch,this.startPivotPosition=this.orbitCamera.pivotPoint.clone())},KeyboardInput.prototype.update=function(t){this.orbitCamera&&this.app.keyboard.wasPressed(pc.KEY_SPACE)&&(this.orbitCamera.reset(this.startYaw,this.startPitch,this.startDistance),this.orbitCamera.pivotPoint=this.startPivotPosition)};var MouseInput=pc.createScript("mouseInput");MouseInput.attributes.add("orbitSensitivity",{type:"number",default:.3,title:"Orbit Sensitivity",description:"How fast the camera moves around the orbit. Higher is faster"}),MouseInput.attributes.add("distanceSensitivity",{type:"number",default:.15,title:"Distance Sensitivity",description:"How fast the camera moves in and out. Higher is faster"}),MouseInput.prototype.initialize=function(){if(this.orbitCamera=this.entity.script.orbitCamera,this.orbitCamera){var t=this,onMouseOut=function(o){t.onMouseOut(o)};this.app.mouse.on(pc.EVENT_MOUSEDOWN,this.onMouseDown,this),this.app.mouse.on(pc.EVENT_MOUSEUP,this.onMouseUp,this),this.app.mouse.on(pc.EVENT_MOUSEMOVE,this.onMouseMove,this),this.app.mouse.on(pc.EVENT_MOUSEWHEEL,this.onMouseWheel,this),window.addEventListener("mouseout",onMouseOut,!1),this.on("destroy",(function(){this.app.mouse.off(pc.EVENT_MOUSEDOWN,this.onMouseDown,this),this.app.mouse.off(pc.EVENT_MOUSEUP,this.onMouseUp,this),this.app.mouse.off(pc.EVENT_MOUSEMOVE,this.onMouseMove,this),this.app.mouse.off(pc.EVENT_MOUSEWHEEL,this.onMouseWheel,this),window.removeEventListener("mouseout",onMouseOut,!1)}))}this.app.mouse.disableContextMenu(),this.lookButtonDown=!1,this.panButtonDown=!1,this.lastPoint=new pc.Vec2},MouseInput.fromWorldPoint=new pc.Vec3,MouseInput.toWorldPoint=new pc.Vec3,MouseInput.worldDiff=new pc.Vec3,MouseInput.prototype.pan=function(t){var o=MouseInput.fromWorldPoint,e=MouseInput.toWorldPoint,i=MouseInput.worldDiff,s=this.entity.camera,n=this.orbitCamera.distance;s.screenToWorld(t.x,t.y,n,o),s.screenToWorld(this.lastPoint.x,this.lastPoint.y,n,e),i.sub2(e,o),this.orbitCamera.pivotPoint.add(i)},MouseInput.prototype.onMouseDown=function(t){switch(t.button){case pc.MOUSEBUTTON_LEFT:this.lookButtonDown=!0;break;case pc.MOUSEBUTTON_MIDDLE:case pc.MOUSEBUTTON_RIGHT:this.panButtonDown=!0}},MouseInput.prototype.onMouseUp=function(t){switch(t.button){case pc.MOUSEBUTTON_LEFT:this.lookButtonDown=!1;break;case pc.MOUSEBUTTON_MIDDLE:case pc.MOUSEBUTTON_RIGHT:this.panButtonDown=!1}},MouseInput.prototype.onMouseMove=function(t){pc.app.mouse;this.lookButtonDown?(this.orbitCamera.pitch-=t.dy*this.orbitSensitivity,this.orbitCamera.yaw-=t.dx*this.orbitSensitivity):this.panButtonDown&&this.pan(t),this.lastPoint.set(t.x,t.y)},MouseInput.prototype.onMouseWheel=function(t){this.orbitCamera.distance-=t.wheel*this.distanceSensitivity*(.1*this.orbitCamera.distance),t.event.preventDefault()},MouseInput.prototype.onMouseOut=function(t){this.lookButtonDown=!1,this.panButtonDown=!1};var TxtArMessages=pc.createScript("txtArMessages");TxtArMessages.prototype.initialize=function(){this.entity.element.enabled=!1,this._registerListeners("on"),this.on("destroy",this._onDestroy,this)},TxtArMessages.prototype._onDestroy=function(){this._registerListeners("off")},TxtArMessages.prototype._registerListeners=function(t){this.app[t]("ar:available",this._onArAvailable,this),this.app[t]("ar:onStart",this._onArStart,this),this.app[t]("ar:hit:start",this._onArHitStart,this),this.app[t]("ar:onTracking",this._onArTracking,this),this.app[t]("ar:positioner:place",this._onArPositionPlace,this),this.app[t]("ar:onEnd",this._onArEnd,this)},TxtArMessages.prototype._onArAvailable=function(t){t||(this.entity.element.enabled=!0,this.entity.element.text="AR no es compatible con este dispositivo")},TxtArMessages.prototype._onArStart=function(){this.entity.element.enabled=!0,this.entity.element.text="mueve lentamente el dispositivo en dirección al suelo"},TxtArMessages.prototype._onArHitStart=function(){this.app.once("ar:hit",this._onArHit,this)},TxtArMessages.prototype._onArHit=function(){this.entity.element.enabled=!0,this.entity.element.text="toca para insertar el modelo 3D en el suelo"},TxtArMessages.prototype._onArTracking=function(){},TxtArMessages.prototype._onArPositionPlace=function(){this.entity.element.enabled=!1},TxtArMessages.prototype._onArEnd=function(){this.entity.element.enabled=!1,this.app.off("ar:hit",this._onArHit,this)};var EntityPositioner=pc.createScript("entityPositioner");EntityPositioner.attributes.add("targetEntity",{type:"entity",description:"The target entity to position."}),EntityPositioner.attributes.add("pointerPreviewEntity",{type:"entity",description:"(Optional) If set, an entity to be positioned on the current AR HitTest location."}),EntityPositioner.attributes.add("defaultDistance",{type:"number",description:"The default distance to position the target entity if hitTest is not available.",default:2}),EntityPositioner.attributes.add("useInput",{type:"boolean",description:"If set to True, allow for input (mouse, touch) to scale this Entity.",default:!0}),EntityPositioner.attributes.add("scaleSensitivity",{type:"number",default:.2,description:"If useInput is set to True, how sensitive scaling is."}),EntityPositioner.prototype.initialize=function(){this.pointerPreviewEntity&&(this.pointerPreviewEntity.enabled=!1),this._scale=1,this._hasPositioned=!1,this._isPinch=!1,this._inputSources=[],this._lastPinchDistance=0,this._registerListeners("on"),this.on("destroy",this._onDestroy,this)},EntityPositioner.prototype._onDestroy=function(){this._registerListeners("off")},EntityPositioner.prototype.update=function(t){this.useInput&&this._updateXrInput()},EntityPositioner.prototype._registerListeners=function(t){this.app[t]("ar:request:start",this._startAugmentedRealitySession,this),this.app[t]("ar:onTracking",this._onTracking,this),this.app[t]("ar:hit",this._onArHit,this),this.app[t]("ar:hit:disabled",this._arHitDisabled,this),this.app[t]("ar:onEnd",this._onArEnd,this),this.app.xr&&this.app.xr.input&&(this.app.xr.input[t]("selectstart",this._onXrSelectStart,this),this.app.xr.input[t]("selectend",this._onXrSelectEnd,this))},EntityPositioner.prototype._startAugmentedRealitySession=function(){this.pointerPreviewEntity&&(this.pointerPreviewEntity.enabled=!1),this.targetEntity.enabled=!1,this.targetEntity.setLocalPosition(0,0,0),this._hasPositioned=!1},EntityPositioner.prototype._onTracking=function(){this._hasPositioned&&(this.targetEntity.enabled=!0,this.pointerPreviewEntity.enabled=!1,this.app.fire("ar:positioner:place"))},EntityPositioner.prototype._onArHit=function(t,i){this.pointerPreviewEntity&&!this.targetEntity.enabled&&(this.pointerPreviewEntity.enabled=!0,this.pointerPreviewEntity.setPosition(t),this.pointerPreviewEntity.setRotation(i))},EntityPositioner.prototype._arHitDisabled=function(){this.pointerPreviewEntity&&(this.pointerPreviewEntity.enabled=!1),this.targetEntity.setLocalPosition(0,0,-this.defaultDistance),this._hasPositioned=!0},EntityPositioner.prototype._onArEnd=function(){this._scale=1,this.targetEntity.enabled=!0,this.targetEntity.setLocalPosition(0,0,0),this.targetEntity.setLocalScale(1,1,1),this.pointerPreviewEntity&&(this.pointerPreviewEntity.setLocalScale(1,1,1),this.pointerPreviewEntity.enabled=!1)},EntityPositioner.prototype._getPinchDistance=function(t,i){var e=t.x-i.x,n=t.y-i.y;return Math.sqrt(e*e+n*n)},EntityPositioner.prototype._onXrSelectStart=function(t){this._inputSources.push(t),2===this._inputSources.length&&(this._lastPinchDistance=this._getPinchDistance(this._inputSources[0].getOrigin(),this._inputSources[1].getOrigin()),this._isPinch=!0)},EntityPositioner.prototype._onXrSelectEnd=function(t){1!==this._inputSources.length||this._hasPositioned||this._isPinch||(this._hasPositioned=!0,this.targetEntity.setLocalPosition(this.pointerPreviewEntity.getLocalPosition()),this._onTracking());const i=this._inputSources.indexOf(t);i>-1&&this._inputSources.splice(i,1),0===this._inputSources.length&&(this._isPinch=!1)},EntityPositioner.prototype._updateXrInput=function(){if(2===this._inputSources.length){var t=this._getPinchDistance(this._inputSources[0].getOrigin(),this._inputSources[1].getOrigin()),i=t-this._lastPinchDistance;this._lastPinchDistance=t,this._scale-=i*this.scaleSensitivity*.1*(.1*this._scale),this.targetEntity.setLocalScale(this._scale,this._scale,this._scale),this.pointerPreviewEntity&&this.pointerPreviewEntity.enabled&&this.pointerPreviewEntity.setLocalScale(this._scale,this._scale,this._scale)}};var ToggleVisibility=pc.createScript("toggleVisibility");ToggleVisibility.attributes.add("modelEntity",{type:"entity",description:"El modelo 3D que se mostrará/ocultará"}),ToggleVisibility.attributes.add("buttonEntity",{type:"entity",description:"El botón UI que activará el toggle"}),ToggleVisibility.prototype.initialize=function(){this.buttonEntity&&this.buttonEntity.element&&this.buttonEntity.element.on("click",this.onButtonClick,this),this.modelEntity.enabled=!0},ToggleVisibility.prototype.toggleModel=function(){this.modelEntity.enabled=!this.modelEntity.enabled},ToggleVisibility.prototype.onButtonClick=function(){this.toggleModel()};var ToggleMultipleVisibility=pc.createScript("toggleMultipleVisibility");ToggleMultipleVisibility.attributes.add("modelEntities",{type:"entity",array:!0,description:"Los modelos 3D que se mostrarán/ocultarán"}),ToggleMultipleVisibility.attributes.add("buttonEntity",{type:"entity",description:"El botón UI que activará el toggle"}),ToggleMultipleVisibility.prototype.initialize=function(){this.buttonEntity&&this.buttonEntity.element&&this.buttonEntity.element.on("click",this.onButtonClick,this),this.modelEntities.forEach((function(t){t.enabled=!0}))},ToggleMultipleVisibility.prototype.toggleModels=function(){this.modelEntities.forEach((function(t){t.enabled=!t.enabled}))},ToggleMultipleVisibility.prototype.onButtonClick=function(){this.toggleModels()};var ToggleTexture=pc.createScript("toggleTexture");ToggleTexture.attributes.add("modelEntities",{type:"entity",array:!0,description:"Los modelos a los que se les cambiará la textura"}),ToggleTexture.attributes.add("texture1",{type:"asset",assetType:"texture",description:"La primera textura"}),ToggleTexture.attributes.add("texture2",{type:"asset",assetType:"texture",description:"La segunda textura"}),ToggleTexture.attributes.add("buttonEntity",{type:"entity",description:"El botón que activará el cambio de textura"}),ToggleTexture.prototype.initialize=function(){this.buttonEntity&&this.buttonEntity.element&&this.buttonEntity.element.on("click",this.onButtonClick,this),this.applyTexture(this.texture1),this.isTexture1=!0},ToggleTexture.prototype.applyTexture=function(t){this.modelEntities.forEach((function(e){var i=e.model.material.clone();i.diffuseMap=t.resource,i.update(),e.model.meshInstances.forEach((function(t){t.material=i}))}))},ToggleTexture.prototype.onButtonClick=function(){this.isTexture1?this.applyTexture(this.texture2):this.applyTexture(this.texture1),this.isTexture1=!this.isTexture1};var ToggleMaterial=pc.createScript("toggleMaterial");ToggleMaterial.attributes.add("modelEntities",{type:"entity",array:!0,description:"Los modelos o renders a los que se les cambiará el material"}),ToggleMaterial.attributes.add("material1",{type:"asset",assetType:"material",description:"El primer material"}),ToggleMaterial.attributes.add("material2",{type:"asset",assetType:"material",description:"El segundo material"}),ToggleMaterial.attributes.add("buttonEntity",{type:"entity",description:"El botón que activará el cambio de material"}),ToggleMaterial.prototype.initialize=function(){this.buttonEntity&&this.buttonEntity.element&&this.buttonEntity.element.on("click",this.onButtonClick,this),this.applyMaterial(this.material1),this.isMaterial1=!0},ToggleMaterial.prototype.applyMaterial=function(t){this.modelEntities.forEach((function(e){e.render?e.render.meshInstances.forEach((function(e){e.material=t.resource})):e.model&&e.model.meshInstances.forEach((function(e){e.material=t.resource}))}))},ToggleMaterial.prototype.onButtonClick=function(){this.isMaterial1?this.applyMaterial(this.material2):this.applyMaterial(this.material1),this.isMaterial1=!this.isMaterial1};