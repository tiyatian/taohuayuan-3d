import { THREE, rng, noise2, smooth, riverX, riverHalf, groundHeight, canvasTexture } from './world-utils.js';

export function createTerrain(scene) {
  const random = rng(96171);
  const group = new THREE.Group();
  group.name = '山川与河岸';
  scene.add(group);
  const groundTex = canvasTexture((ctx, s) => {
    ctx.fillStyle='#7f8054'; ctx.fillRect(0,0,s,s);
    for (let i=0;i<52000;i++) {
      const k=random(), x=random()*s, y=random()*s;
      ctx.fillStyle=k<.30?'rgba(48,65,35,.18)':k<.60?'rgba(181,164,116,.22)':'rgba(106,113,65,.26)';
      ctx.fillRect(x,y,random()*4+.5,random()*3+.5);
    }
    for(let i=0;i<4200;i++) {ctx.fillStyle='rgba(208,193,152,.12)';ctx.beginPath();ctx.ellipse(random()*s,random()*s,random()*2+.2,random()*.8+.2,random()*3,0,Math.PI*2);ctx.fill();}
  });
  groundTex.wrapS=groundTex.wrapT=THREE.RepeatWrapping;groundTex.repeat.set(55,75);groundTex.anisotropy=8;
  const geo = new THREE.PlaneGeometry(520,680,240,300); geo.rotateX(-Math.PI/2);geo.translate(0,0,-100);
  const p = geo.attributes.position;
  const colors = new Float32Array(p.count*3), c = new THREE.Color();
  const green = new THREE.Color('#9a9e73'), sand = new THREE.Color('#c2b393'), wet = new THREE.Color('#8e9580');
  for(let i=0;i<p.count;i++) {
    const x=p.getX(i), z=p.getZ(i), d=Math.abs(x-riverX(z));
    p.setY(i,groundHeight(x,z));
    const edge=smooth(riverHalf(z)+1,riverHalf(z)+5.5,d);
    c.copy(sand).lerp(green,edge);
    if(d<riverHalf(z)+1.5)c.lerp(wet,.5);
    c.multiplyScalar(.85+noise2(x*.13,z*.13)*.28);
    colors.set([c.r,c.g,c.b],i*3);
  }
  geo.setAttribute('color',new THREE.BufferAttribute(colors,3));geo.computeVertexNormals();
  const terrain = new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:groundTex,vertexColors:true,roughness:1,metalness:0}));
  terrain.name='连续地形';terrain.receiveShadow=true; group.add(terrain);

  const rockTex = canvasTexture((ctx,s)=>{
    const data=ctx.createImageData(s,s);
    for(let y=0;y<s;y++)for(let x=0;x<s;x++){
      const broad=noise2(x*.024,y*.019),fine=noise2(x*.19+61,y*.16+28),streak=noise2(x*.075+8,y*.007+17);
      const fissure=Math.pow(1-streak,4);
      const bed=Math.sin(y*.09+noise2(x*.025,y*.017)*2.5);
      const strata=Math.max(0,bed-.77)*.09;
      const v=THREE.MathUtils.clamp(.79+broad*.18+fine*.10-fissure*.10-strata,.32,1);
      const i=(y*s+x)*4;
      data.data[i]=Math.round(v*245);data.data[i+1]=Math.round(v*244);data.data[i+2]=Math.round(v*231);data.data[i+3]=255;
    }
    ctx.putImageData(data,0,0);
    // Fine irregular mineral seams and dark rain channels break up the large rock faces.
    for(let i=0;i<95;i++){
      let x=random()*s,y=random()*s;
      ctx.strokeStyle=i%3===0?'rgba(57,69,53,.12)':'rgba(111,113,96,.10)';ctx.lineWidth=random()*2+.4;
      ctx.beginPath();ctx.moveTo(x,y);
      for(let j=0;j<13;j++){x+=random()*9-4.5;y+=random()*13;ctx.lineTo(x,y);}ctx.stroke();
    }
  });rockTex.wrapS=rockTex.wrapT=THREE.RepeatWrapping;rockTex.anisotropy=8;
  const mountainMat=new THREE.MeshStandardMaterial({map:rockTex,bumpMap:rockTex,bumpScale:.22,vertexColors:true,roughness:.98});
  const rockColor=new THREE.Color('#aaa89a'),forestColor=new THREE.Color('#425c37');
  function mountain(x,z,width,height,depth,seed,distance=0) {
    const rand=rng(seed),seg=84,rings=64;
    const vertices=[],uvs=[],indices=[],color=[];
    const phases=Array.from({length:8},()=>rand()*Math.PI*2);
    for(let iy=0;iy<=rings;iy++){
      const t=iy/rings;
      // Broad weathered shoulders with a small irregular crown, rather than a single conical apex.
      const profile=.19+.81*Math.pow(Math.max(0,1-Math.pow(t,2.9)),.62);
      for(let j=0;j<=seg;j++){
        const a=j/seg*Math.PI*2,ax=Math.cos(a),az=Math.sin(a);
        const broad=noise2(ax*2.7+seed,az*2.7+seed*.71)-.5;
        const angular=noise2(ax*11+seed*.38,az*11+seed*.54);
        const fractured=noise2(ax*9+t*6+seed,az*9+t*4+seed)-.5;
        const shelves=Math.sin(t*67+noise2(ax*4+seed,az*4+seed)*4)*.012;
        const radius=profile*(1+broad*.34+(angular-.5)*.105+fractured*.10+shelves);
        const xx=ax*width*radius,zz=az*depth*radius;
        const shiftX=Math.sin(t*2.7+phases[3])*width*t*.14;
        const shiftZ=Math.sin(t*3.4+phases[5])*depth*t*.12;
        const crownRipple=(.035*Math.sin(a*3+phases[6])+.021*Math.sin(a*7+phases[7]))*smooth(.56,1,t);
        let yy=height*(t+crownRipple)+(noise2(xx*.13+seed,zz*.13+seed+t*3)-.5)*height*.028*Math.sin(t*Math.PI);
        vertices.push(x+xx+shiftX,yy-2,z+zz+shiftZ);
        uvs.push(j/seg*3,t*4);
        const n=noise2(xx*.065+seed,zz*.065+seed+t*2);
        const vegetation=smooth(.30,.69,n)*(.92-t*.28);
        c.copy(rockColor).lerp(forestColor,vegetation);
        const verticalRain=noise2(ax*12+seed,az*12+seed);
        c.multiplyScalar(.76+.24*verticalRain+.09*noise2(a*3,t*20+seed));
        if(distance)c.lerp(new THREE.Color('#98aa9d'),distance*.23);
        color.push(c.r,c.g,c.b);
        if(iy<rings&&j<seg){const a1=iy*(seg+1)+j,b1=a1+seg+1;indices.push(a1,b1,a1+1,b1,b1+1,a1+1);}
      }
    }
    // A low rounded cap joins the weathered crown. It is wide enough to avoid a needle silhouette.
    const topCenter=vertices.length/3;
    const capX=x+Math.sin(2.7+phases[3])*width*.14,capZ=z+Math.sin(3.4+phases[5])*depth*.12;
    vertices.push(capX,height*1.023-2,capZ);uvs.push(1.5,4);c.copy(rockColor).lerp(forestColor,.52);color.push(c.r,c.g,c.b);
    for(let j=0;j<seg;j++)indices.push(rings*(seg+1)+j,topCenter,rings*(seg+1)+j+1);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.setAttribute('color',new THREE.Float32BufferAttribute(color,3));g.setIndex(indices);g.computeVertexNormals();
    const m=new THREE.Mesh(g,mountainMat);m.name='石灰岩山体';m.castShadow=false;m.receiveShadow=true;group.add(m);
  }
  // Staggered landforms keep the valley open while overlapping ridgelines add atmospheric depth.
  const mountains=[
    [-137,-24,52,86,64,17,0],[-126,-99,42,112,52,28,0],[-150,-175,49,142,62,39,.1],[-97,-188,32,94,41,46,.2],
    [151,-26,61,101,70,57,0],[130,-112,45,128,51,61,.1],[170,-196,57,151,65,73,.2],[93,-228,35,95,43,86,.3],
    [-201,-263,71,148,84,94,.5],[-116,-300,48,145,62,103,.6],[-52,-331,43,109,62,127,.6],
    [18,-354,54,142,65,134,.7],[87,-324,57,149,65,147,.6],[170,-300,70,169,82,159,.6],
    [-264,-381,91,186,94,173,.8],[258,-372,93,184,98,186,.8],[-86,-443,100,172,81,193,1],[85,-451,112,185,85,203,1]
  ];mountains.forEach(v=>{v[3]*=.72;mountain(...v);});

  const pebbleGeo=new THREE.IcosahedronGeometry(1,1);
  const rp=pebbleGeo.attributes.position;
  for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),f=.88+noise2(x*5+13,z*5+y)*.23;rp.setXYZ(i,x*f,y*f,z*f);}pebbleGeo.computeVertexNormals();
  const pebbleMat=new THREE.MeshStandardMaterial({color:'#9c9e89',roughness:.94});
  const pebbles=new THREE.InstancedMesh(pebbleGeo,pebbleMat,1250);pebbles.name='河滩卵石';pebbles.receiveShadow=true;
  const dummy=new THREE.Object3D();
  for(let i=0;i<1250;i++){
    const z=-200+random()*330,side=random()<.5?-1:1;
    const x=riverX(z)+side*(riverHalf(z)+random()*3.9-1.1);
    let scale=.08+Math.pow(random(),2)*.62;
    dummy.position.set(x,groundHeight(x,z)+scale*.14,z);dummy.rotation.set(random(),random()*Math.PI,random()*.6);dummy.scale.set(scale*1.4,scale*.7,scale);dummy.updateMatrix();pebbles.setMatrixAt(i,dummy.matrix);
    c.setHSL(.12+random()*.05,.07+random()*.09,.31+random()*.2);pebbles.setColorAt(i,c);
  }group.add(pebbles);
  const boulders=new THREE.InstancedMesh(pebbleGeo,new THREE.MeshStandardMaterial({color:'#828776',roughness:1}),110);boulders.name='苔石';boulders.castShadow=true;boulders.receiveShadow=true;
  for(let i=0;i<110;i++){
    const z=-185+random()*300,side=random()<.5?-1:1;
    let x=riverX(z)+side*(riverHalf(z)+2.5+random()*2.5);
    if(i>60)x=side*(55+random()*42);
    const s=.5+random()*1.75;
    dummy.position.set(x,groundHeight(x,z)+s*.1,z);dummy.scale.set(s*(.8+random()*.8),s*(.6+random()*.6),s);dummy.rotation.set(random()*.7,random()*6.3,random()*.5);dummy.updateMatrix();boulders.setMatrixAt(i,dummy.matrix);
    c.setHSL(.18+random()*.06,.09+random()*.09,.27+random()*.16);boulders.setColorAt(i,c);
  }group.add(boulders);
  const pathTex=canvasTexture((ctx,s)=>{
    const im=ctx.createImageData(s,s);
    for(let y=0;y<s;y++)for(let x=0;x<s;x++){
      const n=noise2(x*.21,y*.10),edge=Math.min(y,s-1-y)/(s*.20);
      const i=(y*s+x)*4,v=.78+n*.24;
      im.data[i]=Math.round(142*v);im.data[i+1]=Math.round(128*v);im.data[i+2]=Math.round(97*v);im.data[i+3]=Math.round(smooth(0,1,edge)*205);
    }
    ctx.putImageData(im,0,0);
  });pathTex.wrapS=THREE.RepeatWrapping;pathTex.repeat.set(1,1);
  const pathMat=new THREE.MeshStandardMaterial({map:pathTex,color:'#aaa38d',roughness:1,transparent:true,opacity:.85,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-2});
  function path(points,width){
    const curve=new THREE.CatmullRomCurve3(points.map(([x,z])=>new THREE.Vector3(x,0,z))),vv=[],uu=[],ii=[],segments=280;
    for(let i=0;i<=segments;i++){
      const t=i/segments,pos=curve.getPoint(t),dir=curve.getTangent(t),nx=-dir.z,nz=dir.x;
      const variation=.9+noise2(pos.x*.31,pos.z*.31)*.22;
      for(const side of [-1,1]){
        const x=pos.x+nx*width*.5*side*variation,z=pos.z+nz*width*.5*side*variation;
        vv.push(x,groundHeight(x,z)+.105,z);uu.push(t*20,side*.5+.5);
      }
      if(i<segments){const a=i*2;ii.push(a,a+1,a+2,a+1,a+3,a+2);}
    }
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vv,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uu,2));g.setIndex(ii);g.computeVertexNormals();
    const m=new THREE.Mesh(g,pathMat);m.receiveShadow=true;m.name='村间土径';group.add(m);
  }
  path([[riverX(8)+riverHalf(8)+3,8],[15,7],[23,4],[30,-6],[39,-10],[51,-24]],1.65);
  path([[-23,62],[-24,40],[-28,22],[-27,4],[-31,-17],[-26,-34],[-24,-61]],1.25);
  return {group, mountainCount:mountains.length, update() {}};
}
