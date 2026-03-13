const windowBox = document.getElementById("chat-window");

const input = document.getElementById("question");
const sendBtn = document.getElementById("send");
const messages = document.getElementById("chat-messages");
const suggestionsBox = document.getElementById("suggested-prompts");

sendBtn.onclick = askQuestion;

input.addEventListener("keypress", function(event){
  if(event.key === "Enter"){
    askQuestion();
  }
});


/* -----------------------------
FORMAT AI TEXT (Markdown → HTML)
----------------------------- */

function formatAI(text){

  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/^\s*• (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n/g, "<br>");
}


/* -----------------------------
ADD MESSAGE
----------------------------- */

async function addMessage(text, sender){

  const msg = document.createElement("div");
   msg.className = "message " + sender;

  messages.appendChild(msg);

  if(sender === "user"){

    msg.innerHTML = '<div class="bubble">' + text + '</div>';

  } else {

    let i = 0;

    while(i <= text.length){

      const partial = text.slice(0,i);

      msg.innerHTML =
  '<div class="avatar">E</div>' +
  '<div class="bubble">' + formatAI(partial) + '</div>';

      messages.scrollTop = messages.scrollHeight;

      await new Promise(r => setTimeout(r,15));

      i++;

    }

  }

}


/* -----------------------------
DISABLE INPUTS WHILE AI TYPES
----------------------------- */

function setInputsDisabled(state){

  input.disabled = state;
  sendBtn.disabled = state;

  const buttons = document.querySelectorAll(".suggest-btn");
  buttons.forEach(btn => btn.disabled = state);

}


/* -----------------------------
ASK QUESTION
----------------------------- */

async function askQuestion(){

  const question = input.value;

  if(!question) return;

  addMessage(question,"user");

  input.value="";

  setInputsDisabled(true);

  const typing = document.createElement("div");
  typing.className="message";
  typing.id="typing";
  typing.innerHTML="<em>Easha is thinking...</em>";

  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;

  const res = await fetch("/ask",{
    method:"POST",
    headers:{
      "Content-Type":"application/json"
    },
    body: JSON.stringify({question})
  });

  const data = await res.json();

  typing.remove();

  await addMessage(data.answer,"bot");

  updateSuggestions(data.suggestions);

  setInputsDisabled(false);

}


/* -----------------------------
UPDATE SUGGESTED PROMPTS
----------------------------- */

function updateSuggestions(list){

  suggestionsBox.innerHTML="";

  if(!list) return;

  list.forEach(text => {

    const btn = document.createElement("button");

    btn.className="suggest-btn";
    btn.innerText=text;

    btn.onclick=()=>{
      input.value=text;
      askQuestion();
    };

    suggestionsBox.appendChild(btn);

  });

}


/* -----------------------------
INITIAL PROMPTS
----------------------------- */

function setInitialPrompts(){

  updateSuggestions([
    "Tell me about Proact",
    "Show me a case study",
    "Explain your design process",
    "What tools do you use?"
  ]);

  addMessage(
`Hi! I'm Easha's AI portfolio assistant 👋

You can ask me about:
• UX case studies  
• my design process  
• AI + UX work`,
    "bot"
  );

}


/* -----------------------------
LOAD CHAT WHEN PAGE OPENS
----------------------------- */

window.onload = () => {
  setInitialPrompts();
};
