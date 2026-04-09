const SUPABASE_URL = "https://dcruyugvpftdvqdcnjdl.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjcnV5dWd2cGZ0ZHZxZGNuamRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3NDYxNjUsImV4cCI6MjA4ODMyMjE2NX0.ER8vVJXTYbQjteLe4iATn_nto4aoKgxMiZQ_P25y7QY";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


// ================= CADASTRO =================
async function cadastrar(){

  const email = document.getElementById("email").value;
  const telefone = document.getElementById("telefone").value;
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
      window.location.href = "index.html";
    }, 2000);
}

// ================= LOGIN =================
async function login(){

  const loginInput = document.getElementById("login").value.trim();
  const senha = document.getElementById("senha").value.trim();

  let emailParaLogin = loginInput;

  // se não digitou nada
if(!loginInput){
  document.getElementById("msg").innerText = "Digite email ou telefone";
  return;
}

if(!loginInput.includes("@")){

  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("email")
    .eq("telefone", loginInput)
    .single();

  // erro de consulta ou telefone não existe
  if(error || !data){
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
  window.location.href = "index.html";
}


// 🔴 MUITO IMPORTANTE — fora das funções
window.login = login;
window.cadastrar = cadastrar;
window.logout = logout;