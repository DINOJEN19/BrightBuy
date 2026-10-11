import React, {useState} from 'react';
import {productImages} from '../data/productImages';

export default function ProductImage({productName, images, detail=false}) {
  const [failedSource,setFailedSource] = useState(null);
  const [selected,setSelected] = useState(0);
  const sources=Array.isArray(images)?images.map(image=>typeof image==='string'?image:image.url):(productImages[productName] || []);
  const source=sources[selected] || sources[0];
  const available=source && failedSource!==source;
  return <div className={detail?'product-gallery':undefined}>
    <div className={`product-image-frame${detail?' product-image-detail':''}`}>
    {available ? <img src={source} alt={`${productName} — illustrative product photo ${selected+1}`} width="800" height="800" loading={detail?'eager':'lazy'} decoding="async" onError={()=>setFailedSource(source)}/> :
      <div className="product-image-fallback" role="img" aria-label={`${productName}: image not available`}><span aria-hidden="true">{(productName||'BB').split(' ').slice(0,2).map(word=>word[0]).join('')}</span><span>Product image coming soon</span></div>}
    </div>
    {detail && sources.length>1 && <div className="product-gallery-thumbnails" aria-label="Product pictures">
      {sources.map((url,index)=><button type="button" key={url} aria-label={`Show picture ${index+1} of ${productName}`} aria-pressed={selected===index} onClick={()=>{setSelected(index);setFailedSource(null);}}>
        <img src={url} alt="" width="80" height="80"/><span>Picture {index+1}</span>
      </button>)}
    </div>}
  </div>;
}
