//client.js for STT (Speech to Text)
(function() {
  const getElements = d => {
    const btnStart = d.getElementById('btn-start');
    const txtOutput = d.getElementById('txt-output');
    const txtInstructions = d.getElementById('txt-instructions');
    const btnSave = d.getElementById('btn-save');
    const btnLoad = d.getElementById('btn-load');
    const inputSave = d.getElementById('input-save');
    const inputLoad = d.getElementById('input-load');
    return {
      btnStart,
      txtOutput,
      txtInstructions,
      btnSave,
      btnLoad,
      inputSave,
      inputLoad,
    };
  };
  const setupSTT = ({
    onError = Function.prototype,
    onNoSpeech = Function.prototype,
    onNoMatch = Function.prototype,
    onStart = Function.prototype,
    onSpeechEnd = Function.prototype,
    onResult = Function.prototype,
  } = {}) => {
    let SpeechRecognition;
    let recognition;
    try {
      SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognition = new SpeechRecognition();
    } catch (e) {
      return onError(e, false);
    }
    recognition.onstart = function() {
      //instructions.text('Voice recognition activated. Try speaking into the microphone.');
      onStart();
    };
    recognition.onnomatch = function(event) {
      onNoMatch(event);
    };
    recognition.onspeechend = function() {
      //instructions.text('You were quiet for a while so voice recognition turned itself off.');
      onSpeechEnd();
    };

    recognition.onerror = function(event) {
      if (event.error == 'no-speech') {
        // instructions.text('No speech was detected. Try again.');
        onNoSpeech(event);
      } else {
        onError(event);
      }
    };
    recognition.onresult = function(event) {
      // event is a SpeechRecognitionEvent object.
      // It holds all the lines we have captured so far.
      // We only need the current one.
      let current = event.resultIndex;

      // Get a transcript of what was said.
      let result = event.results[current][0];
      let transcript = result.transcript;
      let confidence = result.confidence;
      if (transcript === 'newline') {
        transcript += '\n\n';
      }
      // Add the current transcript to the contents of our Note.
      //document.write(transcript);
      onResult(transcript, confidence, event);
    };
    return recognition;
    //recognition.start();
  };
  window.addEventListener('DOMContentLoaded', () => {
    const {
      btnStart,
      txtOutput,
      txtInstructions,
      btnSave,
      btnLoad,
      inputSave,
      inputLoad,
    } = getElements(document);
    let dontStart = false;
    let toId;
    const STT = setupSTT({
      onError: (err, supported) => {
        if (err === 1)
          err = {
            error:
              'Speech recognition Web API is not supported by your browser.',
          };
        txtInstructions.value +=
          '\nError: ' + (err.error || JSON.stringify(err, false, 2)) + '\n';
        btnStart.textContent = 'Record';
        if (supported === false) {
          const pNoSupport = document.createElement('p');
          pNoSupport.textContent =
            'Speech Recognition is not supported by your browser.\nThis website does not have a custom fallback.\nPlease upgrade your browser.';
          pNoSupport.style.fontSize = '18px';
          pNoSupport.style.color = '#ca2828';
          const help = document.getElementById('help');
          help.insertBefore(pNoSupport, help.childNodes[0]);
        }
      },
      onNoSpeech: () => {
        txtInstructions.value += 'No speech detected\n';
        btnStart.textContent = 'Record';
      },
      onNoMatch: () => {
        txtInstructions.value += "Couldn't understand\n";
        btnStart.textContent = 'Record';
      },
      onSpeechEnd: () => {
        txtInstructions.value += 'Ended recording\n';
        btnStart.textContent = 'Record';
      },
      onStart: () => {
        txtInstructions.value += 'Started recording\n';
        btnStart.textContent = 'Stop';
      },
      onResult: (txt, confidence, evt) => {
        txtInstructions.value += `${(Math.round(confidence * 100) / 100) *
          100}% confident\nResult received\n`;
        if (txt.indexOf('antidisestablishmentarianism') >= 0) {
          txtInstructions.value += 'antidisestablishmentarianism removed.\n';
        }
        console.log('result:', evt);
        btnStart.textContent = 'Record';
        txt = txt.split('new line').join('\n');
        txt = txt.split('antidisestablishmentarianism').join('');
        txt = txt.split('dot dot dot').join('...');
        txt = txt.split('dot').join('.');
        txtOutput.value += txt + '\n';
        let outputNewlines = txtOutput.value.split('\n').length - 1;
        let instructionNewlines = txtInstructions.value.split('\n').length - 1;
        if (outputNewlines > instructionNewlines) {
          let extraNewlines = outputNewlines - instructionNewlines + 1;
          txtInstructions.value += new Array(extraNewlines).fill('\n').join('');
        } else if (outputNewlines < instructionNewlines) {
          let extraNewlines = instructionNewlines - outputNewlines + 1;
          txtOutput.value += new Array(extraNewlines).fill('\n').join('');
        }
        txtOutput.scrollBy(0, window.innerHeight * 100);
        txtInstructions.scrollBy(0, window.innerHeight * 100);
        if (!dontStart) {
          toId = setTimeout(() => {
            STT.start();
          }, 30);
        }
      },
    });
    btnStart.addEventListener('click', () => {
      dontStart = false;
      if (btnStart.textContent === 'Record') {
        STT.start();
        console.log('started');
      } else {
        clearTimeout(toId);
        dontStart = true;
        STT.stop();
        STT.abort();
        console.log('stopped');
        btnStart.textContent = 'Record';
        txtInstructions.value += 'Stopped recording\n';
      }
    });
    btnSave.addEventListener('click', () => {
      const saveName = 'STT_' + inputSave.value;
      const hasData = localStorage.getItem(saveName);
      let confirmed = false;
      if (hasData) {
        confirmed = confirm(
          'This will overwrite data already in ' + saveName + '. Are you sure?'
        );
      } else {
        confirmed = true;
      }
      if (confirmed) {
        localStorage.setItem(
          saveName,
          JSON.stringify({
            txt: txtOutput.value,
            meta: txtInstructions.value,
          })
        );
      }
    });
    btnLoad.addEventListener('click', () => {
      let loadName = 'STT_' + inputLoad.value;
      let data = localStorage.getItem(loadName);
      if (data) {
        try {
          data = JSON.parse(data);
        } catch (err) {
          console.warn("couldn't parse data");
          console.error(err);
        }
        if (typeof data === 'object') {
          let confirmed = false;
          if (txtOutput.value) {
            confirmed = confirm(
              'This will overwrite existing text, are you sure?'
            );
          } else {
            confirmed = true;
          }
          if (confirmed) {
            txtOutput.value = data.txt;
            txtInstructions.value = data.meta;
          }
        }
      } else {
        console.log('no data in', loadName);
      }
    });
  });
})();
