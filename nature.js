import { THREE, rng, noise2, riverX, riverHalf, groundHeight, canvasTexture } from './world-utils.js';

// Deterministic groves made of branching wood and translucent, fine flower sprays.
export function createNature(scene) {
  const random = rng(928743), group = new THREE.Group();
  group.name = 'Peach groves and riverside vegetation';
  scene.add(group);
  const dummy = new THREE.Object3D(), up = new THREE.Vector3(0, 1, 0);
  const branches = [], blooms = [], greens = [], trunks = [];
  const barkTexture = canvasTexture((ctx, s) => {
    ctx.fillStyle = '#6c5b49'; ctx.fillRect(0, 0, s, s);
    for(let i=0;i<2400;i++) {
      const x=random()*s,y=random()*s;
      ctx.strokeStyle = `rgba(${random()>.45?'26,30,23':'173,149,111'},${.06+random()*.24})`;
      ctx.lineWidth=.4+random()*2.1;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+(random()-.5)*12,y+3+random()*65);ctx.stroke();
    }
    for(let i=0;i<32;i++){ctx.fillStyle='#6d75624a';ctx.beginPath();ctx.ellipse(random()*s,random()*s,6+random()*17,3+random()*8,random()*6,0,Math.PI*2);ctx.fill();}
  },256);
  barkTexture.wrapS=barkTexture.wrapT=THREE.RepeatWrapping;
  const bark = new THREE.MeshStandardMaterial({map:barkTexture, roughness:1, color:'#948d7d'});
  const flowerTexture = canvasTexture((ctx,s)=>{
    ctx.clearRect(0,0,s,s);
    // Uneven terminal twigs are visible through gaps between the flowers.
    for(let i=0;i<10;i++){
      const x=s*(.14+random()*.72),y=s*(.12+random()*.71);
      ctx.strokeStyle='#685340b0';ctx.lineWidth=1.1;
      ctx.beginPath();ctx.moveTo(s*.49,s*.9);ctx.quadraticCurveTo(x*.6+s*.2,y+s*.15,x,y);ctx.stroke();
    }
    for(let i=0;i<96;i++){
      let x=(.5+(random()+random()-1)*.46)*s,y=(.48+(random()+random()-1)*.46)*s;
      let r=s*(.016+random()*.015),rot=random()*Math.PI;
      const shade=random();
      const tint=shade<.22?'#fff3e7':shade<.62?'#f9c9cf':'#e8a6b7';
      ctx.fillStyle=tint;
      for(let p=0;p<5;p++){
        const a=rot+p*Math.PI*.4;ctx.beginPath();ctx.ellipse(x+Math.cos(a)*r*.66,y+Math.sin(a)*r*.66,r*.63,r*.49,a,0,Math.PI*2);ctx.fill();
      }
      ctx.fillStyle='#c96880';ctx.beginPath();ctx.arc(x,y,r*.22,0,Math.PI*2);ctx.fill();
      if(i%3===0){ctx.fillStyle='#e4c47b';ctx.fillRect(x-r*.11,y-r*.11,r*.22,r*.22);}
    }
  },256);
  flowerTexture.anisotropy=4;
  const blossomMat = new THREE.MeshStandardMaterial({map:flowerTexture,transparent:false,alphaTest:.42,side:THREE.DoubleSide,roughness:.86,color:'#fff3e9'});
  // A modest subsurface lift keeps shaded blossoms from becoming grey.
  blossomMat.emissive.set('#5d2a37');blossomMat.emissiveIntensity=.16;
  const branch = (a,b,r1,r2) => {
    const delta=new THREE.Vector3().subVectors(b,a);
    dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,delta.clone().normalize());dummy.scale.set(r1,delta.length(),r1);
    dummy.updateMatrix();branches.push(dummy.matrix.clone());
  };
  function peach(x,z,scale=1){
    const base=new THREE.Vector3(x,groundHeight(x,z)-.06,z),yaw=random()*Math.PI*2;
    const bent=new THREE.Vector3((random()-.5)*.55,1.5,(random()-.5)*.55).multiplyScalar(scale).add(base);
    const crown=new THREE.Vector3((random()-.5)*1.2,3.2,(random()-.5)*1.2).multiplyScalar(scale).add(base);
    branch(base,bent,.23*scale,.14*scale);branch(bent,crown,.145*scale,.07*scale);
    for(let a=0;a<5;a++){
      const theta=yaw+a*2.4+random()*.8,spread=(1.5+random()*1.3)*scale;
      const start=bent.clone().lerp(crown,.25+random()*.6);
      const fork=start.clone().add(new THREE.Vector3(Math.cos(theta)*spread,(1.0+random()*1.5)*scale,Math.sin(theta)*spread));
      branch(start,fork,.09*scale,.045*scale);
      for(let b=0;b<3;b++){
        const aa=theta+(b-1)*.7+(random()-.5)*.8;
        const tip=fork.clone().add(new THREE.Vector3(Math.cos(aa)*(1.0+random())*scale,(.65+random()*1.1)*scale,Math.sin(aa)*(1+random())*scale));
        branch(fork,tip,.04*scale,.008*scale);
        // Blossoms follow the last metres of branches, rather than spherical crowns.
        for(let j=0;j<5;j++){
          const p=fork.clone().lerp(tip,.25+random()*.8);
          p.x+=(random()-.5)*.85*scale;p.y+=(random()-.35)*.7*scale;p.z+=(random()-.5)*.85*scale;
          blooms.push({p,size:(.85+random()*.8)*scale,rotation:random()*Math.PI*2,tilt:(random()-.5)*1.15,color:new THREE.Color().setHSL(.95+random()*.035,.10+random()*.11,.77+random()*.2)});
        }
      }
    }
  }
  // Broad peach wood, with the village clearing and shoreline left readable.
  for(let i=0;i<142;i++){
    const x=-67+random()*51,z=-119+random()*190;
    if(Math.abs(x-riverX(z))<riverHalf(z)+6)continue;
    if(z>-66&&z<66&&Math.abs(x-(-26+2*Math.sin(z*.055)))<3.1)continue;
    peach(x,z,.8+random()*.56);
  }
  for(let i=0;i<48;i++){
    const z=-130+random()*199,x=riverX(z)+riverHalf(z)+7+random()*11;
    if(z>-28&&z<26)continue;
    peach(x,z,.78+random()*.5);
  }
  peach(-22,29,1.35);peach(-28,39,1.15);peach(4,49,1.18);peach(11,38,1.03);
  const branchGeo = new THREE.CylinderGeometry(.66,1,1,6,1);
  const wood = new THREE.InstancedMesh(branchGeo,bark,branches.length);
  branches.forEach((m,i)=>wood.setMatrixAt(i,m));wood.castShadow=true;wood.receiveShadow=true;wood.frustumCulled=false;group.add(wood);
  const flowers = new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),blossomMat,blooms.length);
  blooms.forEach((o,i)=>{dummy.position.copy(o.p);dummy.rotation.set(o.tilt,o.rotation,random()*.7);dummy.scale.setScalar(o.size);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);flowers.setColorAt(i,o.color);});
  flowers.castShadow=true;flowers.frustumCulled=false;group.add(flowers);

  const leavesTexture=canvasTexture((ctx,s)=>{
    ctx.clearRect(0,0,s,s);
    for(let i=0;i<290;i++){
      const a=random()*Math.PI*2,r=Math.sqrt(random())*s*.47,x=s*.5+Math.cos(a)*r,y=s*.5+Math.sin(a)*r*.86;
      ctx.fillStyle=['#aab67c','#64804f','#7e985b','#b2bb81'][Math.floor(random()*4)];
      ctx.beginPath();ctx.ellipse(x,y,s*(.012+random()*.016),s*(.006+random()*.009),random()*6,0,Math.PI*2);ctx.fill();
    }
  },256);
  const leafMat=new THREE.MeshStandardMaterial({map:leavesTexture,alphaTest:.4,side:THREE.DoubleSide,roughness:1,color:'#d9deb1'});
  for(let i=0;i<290;i++){
    const z=-220+random()*290,x=(random()>.45?1:-1)*(57+random()*95);
    const h=4+random()*7,y=groundHeight(x,z);
    dummy.position.set(x,y+h*.32,z);dummy.rotation.set(0,random()*6,0);dummy.scale.set(.18,h*.65,.18);dummy.updateMatrix();trunks.push(dummy.matrix.clone());
    for(let j=0;j<8;j++)greens.push({x:x+(random()-.5)*h*.52,y:y+h*.5+random()*h*.4,z:z+(random()-.5)*h*.52,size:h*(.38+random()*.16),rot:random()*6,tilt:(random()-.5)*1.8,color:new THREE.Color().setHSL(.21+random()*.055,.16+random()*.2,.39+random()*.23)});
  }
  const greenWood=new THREE.InstancedMesh(branchGeo,bark,trunks.length);trunks.forEach((m,i)=>greenWood.setMatrixAt(i,m));greenWood.castShadow=true;greenWood.frustumCulled=false;group.add(greenWood);
  const leaves=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),leafMat,greens.length);
  greens.forEach((o,i)=>{dummy.position.set(o.x,o.y,o.z);dummy.rotation.set(o.tilt,o.rot,random()*.9);dummy.scale.setScalar(o.size);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);leaves.setColorAt(i,o.color);});
  leaves.castShadow=true;leaves.frustumCulled=false;group.add(leaves);

  const grassTex=canvasTexture((ctx,s)=>{
    ctx.clearRect(0,0,s,s);
    for(let i=0;i<38;i++){
      const base=random()*s,tip=base+(random()-.5)*s*.5,h=s*(.2+random()*.75);
      ctx.fillStyle=['#7c9756','#849b61','#b2b47e','#5d7c48'][Math.floor(random()*4)];
      ctx.beginPath();ctx.moveTo(base-1.6,s);ctx.quadraticCurveTo(base-2,s-h*.5,tip,s-h);ctx.quadraticCurveTo(base+3,s-h*.5,base+2,s);ctx.fill();
      if(i%9===0){ctx.strokeStyle='#b6a97c';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(base,s);ctx.lineTo(tip,s-h);ctx.stroke();ctx.fillStyle='#afa17a';ctx.beginPath();ctx.ellipse(tip,s-h,2.5,9,.25,0,Math.PI*2);ctx.fill();}
    }
  },128);
  const grassMat=new THREE.MeshStandardMaterial({map:grassTex,alphaTest:.38,side:THREE.DoubleSide,roughness:1,color:'#c7cdad'});
  const grassData=[];
  for(let i=0;i<10500;i++){
    const x=-77+random()*156,z=-135+random()*216,d=Math.abs(x-riverX(z));
    if(d<riverHalf(z)+2.7)continue;
    if(x>16&&x<59&&z>-30&&z<27)continue;
    if(noise2(x*.12,z*.12)<.27)continue;
    const h=.25+random()*.62;
    dummy.position.set(x,groundHeight(x,z)+h*.48,z);dummy.rotation.set(0,random()*Math.PI,0);dummy.scale.set(.55+random()*.8,h,1);dummy.updateMatrix();grassData.push(dummy.matrix.clone());
  }
  const grasses=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),grassMat,grassData.length);grassData.forEach((m,i)=>grasses.setMatrixAt(i,m));grasses.receiveShadow=true;grasses.frustumCulled=false;group.add(grasses);

  // Reeds draw the edge of the river without creating a beach-like border.
  const reedData=[];
  for(let i=0;i<1000;i++){
    const z=-130+random()*210,side=random()>.5?1:-1,x=riverX(z)+side*(riverHalf(z)+1.4+random()*2.5),h=.5+random()*.65;
    dummy.position.set(x,Math.max(groundHeight(x,z),.25)+h*.5,z);dummy.rotation.set(0,random()*Math.PI,0);dummy.scale.set(.9,h,1);dummy.updateMatrix();reedData.push(dummy.matrix.clone());
  }
  const reeds=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),grassMat,reedData.length);reedData.forEach((m,i)=>reeds.setMatrixAt(i,m));reeds.frustumCulled=false;group.add(reeds);

  const petalCount=310,petalPositions=new Float32Array(petalCount*3),petalSeeds=[];
  for(let i=0;i<petalCount;i++){petalSeeds.push({x:-52+random()*83,y:1+random()*13,z:-65+random()*125,s:random()*5,w:.5+random()*.6});}
  const petalGeo=new THREE.BufferGeometry();petalGeo.setAttribute('position',new THREE.BufferAttribute(petalPositions,3));
  const petalTexture=canvasTexture((ctx,s)=>{ctx.fillStyle='#ffd3d6';ctx.beginPath();ctx.ellipse(s*.5,s*.5,s*.23,s*.38,.6,0,Math.PI*2);ctx.fill();},32);
  const petalMat=new THREE.PointsMaterial({map:petalTexture,color:'#ffd5d8',size:.14,transparent:true,opacity:.85,depthWrite:false,sizeAttenuation:true});
  const petals=new THREE.Points(petalGeo,petalMat);petals.frustumCulled=false;group.add(petals);
  return {
    group,
    update(time){
      for(let i=0;i<petalCount;i++){
        const p=petalSeeds[i];petalPositions[i*3]=p.x+Math.sin(time*.31+p.s)*1.2+((time*p.w*.28)%18);petalPositions[i*3+1]=.5+((p.y-time*p.w*.23)%12+12)%12;petalPositions[i*3+2]=p.z+Math.cos(time*.2+p.s)*.7;
      }
      petalGeo.attributes.position.needsUpdate=true;
    }
  };
}
