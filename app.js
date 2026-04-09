const SUPABASE_URL = "https://dcruyugvpftdvqdcnjdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjcnV5dWd2cGZ0ZHZxZGNuamRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDYxNjUsImV4cCI6MjA4ODMyMjE2NX0.ER8vVJXTYbQjteLe4iATn_nto4aoKgxMiZQ_P25y7QY";

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function confirmar() {

  const nome = document.getElementById("nome").value;
  const ida = document.getElementById("ida").checked;
  const volta = document.getElementById("volta").checked;

  const hoje = new Date().toISOString().split("T")[0];

  const { error } = await supabase
    .from("presencas")
    .upsert({
      nome: nome,
      data: hoje,
      ida: ida,
      volta: volta
    });

  document.getElementById("msg").innerText =
    error ? "Erro ao enviar!" : "Confirmado!";
}

async function confirmarPresenca(tipo){
  // pega usuário logado
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if(!user){
    window.location.href = "login.html";
    return;
  }

  const hoje = new Date().toISOString().split("T")[0];

  // verifica se já existe registro hoje
  const { data: registro } = await supabase
    .from("presencas")
    .select("*")
    .eq("user_id", user.id)
    .eq("data", hoje)
    .single();

  // se NÃO existe registro → cria um novo
  if(!registro){
    const novo = {
      user_id: user.id,
      data: hoje,
      ida: tipo === "ida",
      volta: tipo === "volta"
    };

    const { error } = await supabase
      .from("presencas")
      .insert(novo);

    if(error){
      alert("Erro ao confirmar presença");
    }else{
      alert("Presença registrada!");
    }

    return;
  }

  // se já existe → atualiza só o campo necessário
  const atualizacao = tipo === "ida"
    ? { ida: true }
    : { volta: true };

  const { error } = await supabase
    .from("presencas")
    .update(atualizacao)
    .eq("user_id", user.id)
    .eq("data", hoje);

  if(error){
    alert("Erro ao atualizar presença");
  }else{
    alert("Presença atualizada!");
  }
}
function hoje(){
  return new Date().toISOString().split("T")[0];
}

// CONFIRMAR IDA
async function confirmarIda(){

  const { data } = await supabaseClient.auth.getUser();
  const user = data.user;

  const { error } = await supabaseClient
    .from("presencas")
    .upsert({
      user_id: user.id,
      data: hoje(),
      ida: true
    }, { onConflict: "user_id,data" });

  document.getElementById("msg").innerText =
    error ? "Erro ao confirmar ida" : "Ida confirmada ✅";
}


// CONFIRMAR VOLTA (opcional)
async function confirmarVolta(){

  const { data } = await supabaseClient.auth.getUser();
  const user = data.user;

  const { error } = await supabaseClient
    .from("presencas")
    .update({ volta: true })
    .eq("user_id", user.id)
    .eq("data", hoje());

  document.getElementById("msg").innerText =
    error ? "Confirme a ida primeiro!" : "Volta confirmada ✅";
}

window.confirmarIda = confirmarIda;
window.confirmarVolta = confirmarVolta;