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
    const btnOutput = d.getElementById('btn-output');
    return {
      btnStart,
      txtOutput,
      txtInstructions,
      btnSave,
      btnLoad,
      inputSave,
      inputLoad,
      btnOutput,
    };
  };
  const setupSTT = ({
    onError = Function.prototype,
    onNoSpeech = Function.prototype,
    onNoMatch = Function.prototype,
    onStart = Function.prototype,
    onSpeechEnd = Function.prototype,
    onResult = Function.prototype,
    onStopped = Function.prototype,
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
      onStopped();
    };
    recognition.onspeechend = function() {
      //instructions.text('You were quiet for a while so voice recognition turned itself off.');
      onSpeechEnd();
      onStopped();
    };

    recognition.onerror = function(event) {
      if (event.error == 'no-speech') {
        // instructions.text('No speech was detected. Try again.');
        onNoSpeech(event);
      } else {
        onError(event);
      }
      onStopped();
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
      btnOutput,
    } = getElements(document);
    let dontStart = false;
    let toId;
    let t0, t1;
    const STT = setupSTT({
      onStopped: () => {
        btnStart.textContent = 'Start';
        txtOutput.classList.add('inner-shadow');
        console.log('stopped');
      },
      onError: (err, supported) => {
        console.log(err);
        if (err === 1)
          err = {
            error:
              'Speech recognition Web API is not supported by your browser.',
          };
        txtInstructions.value +=
          '\nError: ' + (err.error || JSON.stringify(err, false, 2)) + '\n';
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
        console.log('No speech detected');
        //txtInstructions.value += 'No speech detected\n';
      },
      onNoMatch: () => {
        console.log("Couldn't understand");
        //txtInstructions.value += "Couldn't understand\n";
      },
      onSpeechEnd: () => {
        console.log('Ended recording');
        //txtInstructions.value += 'Ended recording\n';
      },
      onStart: () => {
        console.log('Started ecording');
        //txtInstructions.value += 'Started recording\n';
        btnStart.textContent = 'Stop';
        txtOutput.classList.remove('inner-shadow');
      },
      onResult: (txt, confidence, evt) => {
        t1 = Date.now();
        let time = t1 - t0;
        let humanTime = new Date(time).toUTCString().slice(17, 17 + 8);
        txtInstructions.value += `${humanTime}\n`;
        console.log(`${(Math.round(confidence * 100) / 100) * 100}% confident`);
        //txtInstructions.value += `${(Math.round(confidence * 100) / 100) *
        //  100}% confident\nResult received\n`;
        if (txt.indexOf('antidisestablishmentarianism') >= 0) {
          txtInstructions.value += 'antidisestablishmentarianism removed.\n';
        }
        console.log('result:', evt);
        btnStart.textContent = 'Start';
        txt = txt.split('new line').join('\n');
        txt = txt.split('antidisestablishmentarianism').join('');
        txt = txt.split('dot dot dot').join('...');
        txt = txt.split('dot').join('.');
        txtOutput.value += txt + '\n';
        let outputNewlines = txtOutput.value.split('\n').length - 1;
        let instructionNewlines = txtInstructions.value.split('\n').length - 1;
        //TOOD: add logic to ensure instructions line matches speech line
        //this won't work when speech wraps without a newline character
        if (outputNewlines > instructionNewlines) {
          let extraNewlines = outputNewlines - instructionNewlines + 1;
          txtInstructions.value += new Array(extraNewlines).fill('\n').join('');
        } // else if (outputNewlines < instructionNewlines) {
        //   let extraNewlines = instructionNewlines - outputNewlines + 1;
        //   txtOutput.value += new Array(extraNewlines).fill('\n').join('');
        // }
        txtOutput.scrollBy(0, window.innerHeight * 100);
        txtInstructions.scrollBy(0, window.innerHeight * 100);
        if (!dontStart) {
          toId = setTimeout(() => {
            try {
              STT.start();
            } catch (err) {
              toId = setTimeout(() => {
                try {
                  STT.start();
                } catch (err) {
                  console.log('already started');
                }
              }, 40);
            }
          }, 40);
        }
      },
    });
    btnStart.addEventListener('click', () => {
      console.log('started!');
      dontStart = false;
      if (btnStart.textContent === 'Start') {
        STT.start();
        console.log('started');
        t0 = Date.now();
      } else {
        clearTimeout(toId);
        dontStart = true;
        STT.stop();
        STT.abort();
        console.log('aborted');
        btnStart.textContent = 'Start';
        txtOutput.classList.remove('inner-shadow');
        //txtInstructions.value += 'Stopped recording\n';
      }
    });
    btnOutput.addEventListener('click', () => {
      STT.stop();
      try {
        STT.start();
      } catch (err) {
        console.warn('cannot start again after cliking output..', err);
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
