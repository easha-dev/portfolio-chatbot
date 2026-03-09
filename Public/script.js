const toggle = document.getElementById("chat-toggle");
const windowBox = document.getElementById("chat-window");

const input = document.getElementById("question");
const sendBtn = document.getElementById("send");
const messages = document.getElementById("chat-messages");
const suggestionsBox = document.getElementById("suggested-prompts");

toggle.onclick = () => {
  windowBox.style.display =
    windowBox.style.display === "flex" ? "none" : "flex";
};

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
    // bold
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    // italic
    .replace(/\*(.*?)\*/g, "<em>$1</em>")

    // bullet points
    .replace(/^\s*• (.*)$/gm, "<li>$1</li>")

    // wrap bullet list
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")

    // line breaks
    .replace(/\n/g, "<br>");
}


/* -----------------------------
ADD MESSAGE
----------------------------- */

async function addMessage(text, sender){

  const msg = document.createElement("div");
  msg.className = "message";

  messages.appendChild(msg);

  if(sender === "user"){

    msg.innerHTML = "<strong>You:</strong> " + text;

  } else {

    // typing animation
    let i = 0;

    while(i <= text.length){

      const partial = text.slice(0,i);

      msg.innerHTML =
        "<strong>Easha:</strong> " + formatAI(partial);

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

  // thinking indicator
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
    "Tell me about your design philosophy",
    "Show me a case study",
    "What tools do you use?",
    "Tell me about Proact"
  ]);

  addMessage(
    "Hi! I'm Easha's AI assistant. Ask me about my projects, design process, or experience.",
    "bot"
  );

}

setInitialPrompts();
