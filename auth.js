const SUPABASE_URL = "https://dcruyugvpftdvqdcnjdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjcnV5dWd2cGZ0ZHZxZGNuamRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDYxNjUsImV4cCI6MjA4ODMyMjE2NX0.ER8vVJXTYbQjteLe4iATn_nto4aoKgxMiZQ_P25y7QY";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

//quando o usuario digitar (xx) xxx-xxx o que será salvo no banco de dados serão somente os numeros
function limparTelefone(numero){
  return numero.replace(/\D/g, "");
}


// ================= CADASTRO =================
async function cadastrar(){

  const email = document.getElementById("email").value;
  const telefone = limparTelefone(document.getElementById("telefone").value); 
  const cpf = document.getElementById("cpf").value;
  const instituicao = document.getElementById("instituicao").value;
  const senha = document.getElementById("senha").value;
  const confirmarSenha = document.getElementById("confirmarSenha").value;

  // 🔐 VALIDAÇÃO DE SENHA
  if(senha !== confirmarSenha){
    document.getElementById("msg").innerText = "As senhas não coincidem";
    return;
  }
  if(!email || !telefone || !cpf || !instituicao || !senha){
  document.getElementById("msg").innerText = "Preencha todos os campos";
  return;
}

  const { data, error } = await supabaseClient.auth.signUp({
    phone: telefone,
    email: email,
    password: senha
  });

  console.log("RESPOSTA SIGNUP:", data, error);

  if(error){
    document.getElementById("msg").innerText = error.message;
    return; 
  }

  // ⚠️ esperar sessão ficar ativa
  const { data: sessionData } = await supabaseClient.auth.getSession();
  const userId = sessionData.session.user.id;

  const { error: erroDB } = await supabaseClient
    .from("usuarios")
    .insert({
      id: userId,
      email: email,
      telefone: telefone,
      cpf: cpf,
      instituicao: instituicao
    });

  document.getElementById("msg").innerText =
    erroDB ? erroDB.message : "Conta criada. Redirecionando...";

    //tempo de espera após criar a conta
    setTimeout(() => {
      window.location.href = "login.html";
    }, 2000);
}

// ================= LOGIN =================
async function login(){

  let loginInput = document.getElementById("login").value.trim();
  const telefoneDigitado = limparTelefone(loginInput);
  const senha = document.getElementById("senha").value.trim();

  let emailParaLogin = loginInput;

  // se não digitou nada
if(!loginInput.includes("@")){

  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("email")
    .eq("telefone", telefoneDigitado)
    .maybeSingle();

  if(!data){
    document.getElementById("msg").innerText = "Email/Telefone ou senha inválidos";
    return;
  }

  emailParaLogin = data.email;
}

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: emailParaLogin,
    password: senha
  });

  //se o usuário inserir dados não cadastrados essa mensagem irá aparecer;
  //caso contrário, ele entra no sistema (presenca.html);
  if(error){
    document.getElementById("msg").innerText = "Email/Telefone ou senha inválidos"; //caso o usuário insira dados não cadastrados essa mensagem irá aparecer
  }else{
    window.location.href = "presenca.html"; 
  }
}


// ================= LOGOUT =================
async function logout(){
  await supabaseClient.auth.signOut();
  window.location.href = "login.html";
}


// 🔴 MUITO IMPORTANTE — fora das funções
window.login = login;
window.cadastrar = cadastrar;
window.logout = logout;

// ================= MARCAR PRESENÇA =================
async function marcarPresenca(){

  const { data } = await supabaseClient.auth.getSession();

  if(!data.session){
    window.location.href = "login.html";
    return;
  }

  const userId = data.session.user.id;

  const hoje = new Date();
  const dataHoje = hoje.toISOString().split("T")[0];
  const horaAgora = hoje.toTimeString().split(" ")[0];

  // verificar se já marcou hoje
  const { data: jaExiste } = await supabaseClient
    .from("presencas")
    .select("*")
    .eq("user_id", userId)
    .eq("data", dataHoje)
    .single();

  if(jaExiste){
    document.getElementById("msg").innerText = "Você já marcou presença hoje ✔️";
    return;
  }

  const { error } = await supabaseClient
    .from("presencas")
    .insert({
      user_id: userId,
      data: dataHoje,
      hora: horaAgora
    });

  document.getElementById("msg").innerText =
    error ? error.message : "Presença registrada com sucesso 🎉";
}


// ================= HISTÓRICO =================
async function carregarHistorico(){

  const { data } = await supabaseClient.auth.getSession();

  if(!data.session){
    window.location.href = "login.html";
    return;
  }

  const userId = data.session.user.id;

  const { data: presencas } = await supabaseClient
    .from("presencas")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending:false });

  const lista = document.getElementById("lista");

  if(!presencas || presencas.length === 0){
    lista.innerHTML = "<p>Nenhuma presença registrada.</p>";
    return;
  }

  lista.innerHTML = presencas.map(p =>
    `<p>📅 ${p.data} — ⏰ ${p.hora}</p>`
  ).join("");
}

window.marcarPresenca = marcarPresenca;
window.carregarHistorico = carregarHistorico;