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
  /*if(error){
    document.getElementById("msg").innerText = "Email/Telefone ou senha inválidos"; //caso o usuário insira dados não cadastrados essa mensagem irá aparecer
  }else{
    window.location.href = "presenca.html"; 
  }*/

  const { data: sessionData } = await supabaseClient.auth.getSession();
const userId = sessionData.session.user.id;

const { data: usuario } = await supabaseClient
  .from("usuarios")
  .select("tipo")
  .eq("id", userId)
  .single();

if(usuario.tipo === "admin"){
  window.location.href = "admin.html";
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

  // tenta inserir direto (o banco impede duplicado)
  const { error } = await supabaseClient
    .from("presencas")
    .insert({
      user_id: userId
    });

  const msg = document.getElementById("msg");

  if(error){
    if(error.message.includes("duplicate key")){
      msg.innerText = "Você já marcou presença hoje ✔️";
    } else {
      msg.innerText = "Erro ao marcar presença";
      console.log(error);
    }
    return;
  }

  msg.innerText = "Presença registrada com sucesso 🎉";
}


// ================= HISTÓRICO =================
async function carregarHistorico(){

  const { data } = await supabaseClient.auth.getSession();

  if(!data.session){
    window.location.href = "login.html";
    return;
  }

  const userId = data.session.user.id;

  const { data: presencas, error } = await supabaseClient
    .from("presencas")
    .select("data_presenca")
    .eq("user_id", userId)
    .order("data_presenca", { ascending:false });

  const lista = document.getElementById("lista");

  if(error){
    lista.innerHTML = "Erro ao carregar histórico";
    console.log(error);
    return;
  }

  if(!presencas || presencas.length === 0){
    lista.innerHTML = "<p>Nenhuma presença registrada.</p>";
    return;
  }

  lista.innerHTML = presencas.map(p =>
    `<p>📅 ${p.data_presenca}</p>`
  ).join("");
}

async function carregarPresencasAdmin(){

  const { data: sessionData } = await supabaseClient.auth.getSession();

  if(!sessionData.session){
    window.location.href = "login.html";
    return;
  }

  const lista = document.getElementById("lista");
  lista.innerHTML = "Carregando...";

  // 1️⃣ Buscar presenças
  const { data: presencas, error: erroPresencas } =
    await supabaseClient
      .from("presencas")
      .select("*")
      .order("data_presenca", { ascending:false });

  if(erroPresencas){
    lista.innerHTML = erroPresencas.message;
    console.log(erroPresencas);
    return;
  }

  if(!presencas || presencas.length === 0){
    lista.innerHTML = "Nenhuma presença encontrada.";
    return;
  }

  // 2️⃣ Buscar usuários
  const { data: usuarios, error: erroUsuarios } =
    await supabaseClient
      .from("usuarios")
      .select("id, email, telefone, instituicao");

  if(erroUsuarios){
    lista.innerHTML = erroUsuarios.message;
    console.log(erroUsuarios);
    return;
  }

  // 3️⃣ Cruzar manualmente
  lista.innerHTML = "";

  presencas.forEach(p => {

    const usuario = usuarios.find(u => u.id === p.user_id);

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <p><b>Email:</b> ${usuario ? usuario.email : "Não encontrado"}</p>
      <p><b>Telefone:</b> ${usuario ? usuario.telefone : "-"}</p>
      <p><b>Instituição:</b> ${usuario ? usuario.instituicao : "-"}</p>
      <p><b>Data:</b> ${p.data_presenca}</p>
      <hr>
    `;

    lista.appendChild(div);
  });

}

window.carregarPresencasAdmin = carregarPresencasAdmin;
