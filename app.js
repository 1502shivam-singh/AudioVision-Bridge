import { LangMap, VoiceMap } from "./lib/map.js"
import { CompressImage } from "./lib/imageCompress.js"

function typeWriter(animationContainer, string) {
  let index = 0;
  let currentTimeout;
  animationContainer.textContent = ''

  function type() {
	const nextCharacter = string[index];
	animationContainer.textContent += nextCharacter;
	index++;
  
	if (index === string.length) {
	  clearTimeout(currentTimeout);
	  return;
	}
  
	// Randomize the time between character additions to make it look more natural
	const typingSpeed = Math.floor(Math.random() * 10) + 30;
	currentTimeout = setTimeout(type, typingSpeed);
  }

  type()
}

let isUpload = false;
$( document ).ready(function() {
	let inputs = document.querySelectorAll( '.inputfile' );

	document.querySelector(".translated-exec-go").addEventListener('click', (e) => {
		getTranslation(document.querySelector('#log').textContent)
	})
	document.querySelector(".audiobtn").addEventListener('click', ()=>{
		dictate(document.querySelector('.translated-text').textContent)
	})

	Array.prototype.forEach.call( inputs, function( input )
	{
		let label	 = input.nextElementSibling,
			labelVal = label.innerHTML;

		input.addEventListener( 'change', function( e )
		{
			let fileName = '';
			if( this.files && this.files.length > 1 )
				fileName = ( this.getAttribute( 'data-multiple-caption' ) || '' ).replace( '{count}', this.files.length );
			else
				fileName = e.target.value.split( '\\' ).pop();

			if( fileName ){
				label.querySelector( 'span' ).innerHTML = fileName;

				let reader = new FileReader();

				let imageURL = ""
				let file = this.files[0];
				reader.readAsDataURL(file);
				
				reader.onload = function () {
					let dataURL = reader.result;
					imageURL = dataURL
					
					console.log("File size", file.size);

					Promise.resolve(CompressImage(imageURL, file.size)).then((value) => {
						let imgCompressed = value
						console.log(imgCompressed);
						$("#selected-image").attr("src", dataURL);
						$("#selected-image").addClass("col-12");
						isUpload = true;
						startRecognize(file, imgCompressed);
					  });
				}

			}
			else{
				label.innerHTML = labelVal;
				$("#selected-image").attr("src", '');
				$("#selected-image").removeClass("col-12");
				$("#arrow-right").addClass("fa-arrow-right");
				$("#arrow-right").removeClass("fa-check");
				$("#arrow-right").removeClass("fa-spinner fa-spin");
				$("#arrow-down").addClass("fa-arrow-down");
				$("#arrow-down").removeClass("fa-check");
				$("#arrow-down").removeClass("fa-spinner fa-spin");
				$("#log").empty();
			}
		});

		// Firefox bug fix
		input.addEventListener( 'focus', function(){ input.classList.add( 'has-focus' ); });
		input.addEventListener( 'blur', function(){ input.classList.remove( 'has-focus' ); });
	});
});

$("#startLink").click(function () {
	const img = document.getElementById('selected-image');
	console.log(img);
	startRecognize(img, img.src);
});

async function getTranslation(text) {
	if(text === "") {
		alert("Please extract text from some image before translating")
		return
	}
	console.log("To translate: ", text);
	
	text = text.replace(/[.?&/\\{}():\n\t\r]/g, ' ')
	console.log("To translate after: ", text);

	let myHeaders = new Headers();
	myHeaders.append("Cookie", "__cf_bm=tJ53XYNY2FXHou0aTTigI38aRr9UE28kgqJOrE1I63Q-1675517864-0-Adxq+uoAN2zZOOOFKyixSaG2rqqc4/HzAgatvPesuczyGW9B1vTt+tuGh9UXEiYgejSIW7qumzSTfenvXKwBrgI=");
	const API_KEY = "2ec7fbbc-ae16-4c05-8508-6ec1840eb67e"
	const targetLang = LangMap.get(document.querySelector("#langsel-translate").value)
	
	const inputLang = document.querySelector("#langsel").value.substring(0, 2);
	if(inputLang != "de" && inputLang != "en" && inputLang != "hi") {
		alert("Translation support not added")
		return
	}

	const requestOptions = {
		method: 'GET',
		redirect: 'follow'
	};

	const translateDiv = document.querySelector(".translated-text-block");
	
	document.querySelector(".placeholder").style.display = "none"
	document.querySelector(".blink").style.display = "block"

	try {
		const response = await fetch(`https://nmt-server-core.azurewebsites.net/predict/${inputLang}&${targetLang}&${text}`)
			.then(response => response.text())
			.then(result => JSON.parse(result))
			.catch(error => console.log('error', error)); 
			
		document.querySelector(".blink").style.display = "none"		

		console.log(response);

		const translatedText = response.output_data

		// translateDiv.innerHTML = ''
		typeWriter(translateDiv, translatedText)
		// translateDiv.textContent = translatedText
		// translateDiv.appendChild(document.createTextNode(translatedText))
		window.scrollTo(0, document.body.scrollHeight);
	} catch (e) {
		console.log('error:', e)
		// translateDiv.textContent = text
		typeWriter(translateDiv, text)
	}
}

function startRecognize(img, fileSrc){
	$("#arrow-right").removeClass("fa-arrow-right");
	$("#arrow-right").addClass("fa-spinner fa-spin");
	$("#arrow-down").removeClass("fa-arrow-down");
	$("#arrow-down").addClass("fa-spinner fa-spin");
	recognizeFile(img, fileSrc);
}

async function dictate(transcript) {
	if(transcript === "") {
		alert("No text to dictate: Please translate some text first")
		return
	}

	const requestOptions = {
		method: 'GET',
		redirect: 'follow',
	  };
	  
	const src_lang = document.querySelector("#langsel-translate").value

	const TEX2SPCH_API_KEY = "d1d6aa7348054418a64263411fb3691b"
	try {
		const sound = await fetch(`https://api.voicerss.org/?key=${TEX2SPCH_API_KEY}&hl=${src_lang}&src=${transcript}&c=MP3`, requestOptions)
			.then(sound => {
				console.log(sound);
				const audio = document.querySelector("#audio-elem")
				audio.src = sound.url
				audio.play();
			})

	} catch (e) {
		console.log("Error: ", e);
	}
}

async function progressUpdate(packet){
	const log = document.getElementById('log');

	if(log.firstChild && log.firstChild.status === packet.status){
		if('progress' in packet) {
			const progress = log.firstChild.querySelector('progress')
			progress.value = packet.progress
		}
	} else {
		const line = document.createElement('div');
		line.status = packet.status;
		const status = document.createElement('div')
		status.className = 'status'
		status.appendChild(document.createTextNode(packet.status))
		line.appendChild(status)

		if('progress' in packet){
			const progress = document.createElement('progress')
			progress.value = packet.progress
			progress.max = 1
			line.appendChild(progress)
		}

		if(packet.status == 'done') {
			log.innerHTML = ''
			const pre = document.createElement('pre')
			
			/* pre node created here, child appended to it, a textNode in which we put the detected text */
			// pre.appendChild(document.createTextNode(packet.data.text.replace(/\n\s*\n/g, '\n')))
			// typeWriter(pre, packet.data.text.replace(/\n\s*\n/g, '\n'))
			typeWriter(pre, packet.data)
			
			line.innerHTML = ''
			line.appendChild(pre)
			$(".fas").removeClass('fa-spinner fa-spin')
			$(".fas").addClass('fa-check')
		}

		log.insertBefore(line, log.firstChild)
	}
}

function recognizeFile(file, fileSrc){
	$("#log").empty();
  	const corePath = window.navigator.userAgent.indexOf("Edge") > -1
    ? 'js/tesseract-core.asm.js'
    : 'js/tesseract-core.wasm.js';

	const data = {
		image: fileSrc,
		lang: document.querySelector("#langsel").value, // ocr
	};
	console.log(file, data.lang);

	const myHeaders = new Headers();
	myHeaders.append("apikey", "K86245119988957");
	
	
	const formdata = new FormData();
	formdata.append("language", data.lang);
	formdata.append("isOverlayRequired", "false");
	formdata.append("filetype", file.type);
	isUpload ? formdata.append("base64Image", data.image) : formdata.append("url", data.image)
	
	console.log(file, isUpload, formdata, data.image);

	const requestOptions = {
	  method: 'POST',
	  headers: myHeaders,
	  body: formdata,
	  redirect: 'follow'
	};

	fetch("https://api.ocr.space/parse/image", requestOptions)
	.then(response => response.text())
	.then(result => {
		console.log(result);
		result = JSON.parse(result)
		let translation = ""
		result.ParsedResults.forEach((entry, index) => {
			translation += entry.ParsedText
		})
		console.log(result, translation);
		progressUpdate({ status: 'done', data: translation })
	})
	.catch(error => alert('error:', error));
}
