import * as THREE from './vendor/three.module.js';
export { THREE };
export function rng(seed=23451){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export const smooth=(a,b,t)=>{t=THREE.MathUtils.clamp((t-a)/(b-a),0,1);return t*t*(3-2*t);};
export function noise2(x,z){const h=(a,b)=>{let n=Math.sin(a*127.1+b*311.7)*43758.5453123;return n-Math.floor(n);};let a=Math.floor(x),b=Math.floor(z),u=x-a,v=z-b;u=u*u*(3-2*u);v=v*v*(3-2*v);return THREE.MathUtils.lerp(THREE.MathUtils.lerp(h(a,b),h(a+1,b),u),THREE.MathUtils.lerp(h(a,b+1),h(a+1,b+1),u),v);}
export const riverX=z=>-9+8*Math.sin(z*.024)+3*Math.sin(z*.061);
export const riverHalf=z=>6.4+1.1*Math.sin(z*.038);
export function groundHeight(x,z){let d=Math.abs(x-riverX(z));let rolling=.35+noise2(x*.035,z*.035)*1.0+Math.sin(x*.06+z*.035)*.28;let bank=smooth(riverHalf(z)-1,riverHalf(z)+4.5,d);let hill=smooth(63,145,Math.abs(x))* (11+noise2(x*.024,z*.022)*27);return -1.15+(rolling+1.15)*bank+hill;}
export function canvasTexture(draw,size=512){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
export function placeMesh(mesh,x,z,dy=0){mesh.position.set(x,groundHeight(x,z)+dy,z);return mesh;}
