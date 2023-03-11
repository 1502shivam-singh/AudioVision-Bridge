async function CompressImage(blobImg, fileSize) {
    let compression = 100
    if (fileSize >= 10485760) {
        compression = 5;
    } else if (fileSize >= 5242880) {
        compression = 10;
    } else if (fileSize > 1048576) {
        compression = 20;
    } else if (fileSize <= 1048576) {
        compression = 90;
    }
    
    console.log(fileSize, compression);

    const blob = await (await fetch(blobImg)).blob(); 
	let bitmap = await createImageBitmap(blob);

	let canvas = document.createElement("canvas");
	let ctx = canvas.getContext("2d");
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	ctx.drawImage(bitmap, 0, 0);
	
    let dataUrl = canvas.toDataURL("image/jpeg", 20/100);
	return dataUrl;
}

export { CompressImage }
