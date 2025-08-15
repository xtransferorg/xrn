import React, { ImgHTMLAttributes } from 'react';

const Img = (props: ImgHTMLAttributes<HTMLImageElement>) => {
  return <img {...props} referrerPolicy="no-referrer" />;
};

export default Img;
