const getBrightness = (color) => {
  let res = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  let rgb = [parseInt(res[1], 16), parseInt(res[2], 16), parseInt(res[3], 16)];
  const brightness = Math.round(((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000);
  return brightness;
}

export const titleColor = (color) => {
  return (getBrightness(color) > 135) ? '#000000' : '#ffffff';
}
