import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, StyleSheet, Alert, Modal } from 'react-native';

const SERVER = 'http://172.20.10.2:4000';

export default function App(){
  const [token, setToken] = useState(null);
  const [screen, setScreen] = useState('login');
  const [username, setUsername] = useState('adm');
  const [password, setPassword] = useState('123');
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [cards, setCards] = useState([]);

  // tabs: 'create','manage','kanban'
  const [tab, setTab] = useState('kanban');

  // create user form
  const [newUserName, setNewUserName] = useState('');
  const [newUserUsername, setNewUserUsername] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [newUserPassword, setNewUserPassword] = useState('');

  // edit user
  const [editingUser, setEditingUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('user');

  // create card
  const [cardTitle, setCardTitle] = useState('');
  const [cardDescription, setCardDescription] = useState('');
  const [cardColumn, setCardColumn] = useState('todo');

  // edit card
  const [editingCard, setEditingCard] = useState(null); // {id, title, description, column}
  const [editCardTitle, setEditCardTitle] = useState('');
  const [editCardDescription, setEditCardDescription] = useState('');
  const [editCardColumn, setEditCardColumn] = useState('todo');

  useEffect(()=>{ if(token){ fetchCards(); if(user?.role === 'admin' || user?.role === 'supervisor') fetchUsers();
      if(user?.role === 'admin') setTab('create');
      else if(user?.role === 'supervisor') setTab('manage');
      else setTab('kanban');
    } else {
      setTab('kanban');
    } }, [token, user]);

  async function login(){
    try{
      const res = await fetch(SERVER + '/auth/login', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ username, password })});
      const j = await res.json();
      if(res.ok){
        setToken(j.token);
        setUser(j.user);
        setScreen('home');
      } else {
        Alert.alert('Erro', j.error || 'Login failed');
      }
    }catch(e){ Alert.alert('Erro', e.message); }
  }

  function logout(){
    setToken(null);
    setUser(null);
    setUsers([]);
    setCards([]);
    setUsername('');
    setPassword('');
    setScreen('login');
  }

  async function fetchUsers(){
    if(!token) return;
    try{
      const res = await fetch(SERVER + '/users', { headers:{ Authorization: 'Bearer '+token } });
      if(res.ok){ const j = await res.json();
        const filtered = j.filter(u => u.username !== 'adm');
        setUsers(filtered);
      }
    }catch(e){ console.warn('fetchUsers error', e.message); }
  }

  async function createUser(){
    if(!token) return;
    if(!newUserUsername.trim() || !newUserName.trim() || !newUserPassword) return Alert.alert('Atenção', 'Preencha nome, username e senha');
    try{
      const res = await fetch(SERVER + '/users', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: 'Bearer '+token }, body: JSON.stringify({ username: newUserUsername.trim(), name: newUserName.trim(), role: newUserRole, password: newUserPassword })});
      const j = await res.json();
      if(res.ok){
        Alert.alert('OK','Usuário criado');
        setNewUserName(''); setNewUserUsername(''); setNewUserRole('user'); setNewUserPassword('');
        await fetchUsers();
        setTab('manage');
      } else {
        Alert.alert('Erro', j.error || 'Error');
      }
    }catch(e){ Alert.alert('Erro', e.message); }
  }

  function startEdit(u){
    setEditingUser(u);
    setEditName(u.name || '');
    setEditRole(u.role || 'user');
    setTab('manage');
  }

  async function saveEdit(){
    if(!editingUser) return;
    try{
      const res = await fetch(SERVER + '/users/' + editingUser.id, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization: 'Bearer '+token }, body: JSON.stringify({ name: editName.trim(), role: editRole })});
      const j = await res.json();
      if(res.ok){ Alert.alert('OK','Usuário atualizado'); setEditingUser(null); setEditName(''); setEditRole('user'); await fetchUsers(); }
      else Alert.alert('Erro', j.error || 'Error');
    }catch(e){ Alert.alert('Erro', e.message); }
  }

  async function disableUserAction(id){
    try{
      const res = await fetch(SERVER + '/users/' + id + '/disable', { method:'PATCH', headers:{ Authorization: 'Bearer '+token } });
      const j = await res.json();
      if(res.ok){ Alert.alert('OK','Usuário desativado'); await fetchUsers(); } else Alert.alert('Erro', j.error || 'Error');
    }catch(e){ Alert.alert('Erro', e.message); }
  }

  async function activateUserAction(id){
    try{
      const res = await fetch(SERVER + '/users/' + id + '/activate', { method:'PATCH', headers:{ Authorization: 'Bearer '+token } });
      const j = await res.json();
      if(res.ok){ Alert.alert('OK','Usuário ativado'); await fetchUsers(); } else Alert.alert('Erro', j.error || 'Error');
    }catch(e){ Alert.alert('Erro', e.message); }
  }

  async function fetchCards(){
    if(!token) return;
    try{
      const res = await fetch(SERVER + '/kanban/cards', { headers:{ Authorization: 'Bearer '+token } });
      if(res.ok){ const j = await res.json(); setCards(j); }
    }catch(e){ console.warn('fetchCards', e.message); }
  }

  async function createCard(){
  if(!token) return;
  if(!cardTitle.trim()) return Alert.alert('Atenção', 'Digite um título para o card');
  try{
    // always create new cards in TODO column; allow moving later via edit
    const res = await fetch(SERVER + '/kanban/cards', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: 'Bearer '+token }, body: JSON.stringify({ title: cardTitle.trim(), description: cardDescription.trim(), column: 'todo' })});
    const j = await res.json();
    if(res.ok){ setCardTitle(''); setCardDescription(''); setCardColumn('todo'); fetchCards(); } else Alert.alert('Erro', j.error||'Error');
  }catch(e){ Alert.alert('Erro', e.message); }
}

  function openEditCard(card){
    setEditingCard(card);
    setEditCardTitle(card.title || '');
    setEditCardDescription(card.description || '');
    setEditCardColumn(card.column || 'todo');
  }

  async function saveEditCard(){
    if(!editingCard) return;
    try{
      const res = await fetch(SERVER + '/kanban/cards/' + editingCard.id, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization: 'Bearer '+token }, body: JSON.stringify({ title: editCardTitle.trim(), description: editCardDescription.trim(), column: editCardColumn })});
      const j = await res.json();
      if(res.ok){ Alert.alert('OK','Card atualizado'); setEditingCard(null); setEditCardTitle(''); setEditCardDescription(''); setEditCardColumn('todo'); fetchCards(); }
      else Alert.alert('Erro', j.error || 'Error');
    }catch(e){ Alert.alert('Erro', e.message); }
  }

  function cancelEditCard(){ setEditingCard(null); setEditCardTitle(''); setEditCardDescription(''); setEditCardColumn('todo'); }

  function renderCard({item}){
    return (
      <TouchableOpacity style={styles.card} onPress={()=>openEditCard(item)}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.description ? <Text style={styles.cardDesc}>{item.description}</Text> : null}
        <Text style={styles.cardMeta}>coluna: {item.column}</Text>
      </TouchableOpacity>
    );
  }

  // role selector component
  function RoleSelector({ value, onChange }){
    return (
      <View style={styles.roleRow}>
        {['admin','supervisor','user'].map(r => (
          <TouchableOpacity key={r} style={[styles.roleButton, value === r ? styles.roleButtonActive : null]} onPress={() => onChange(r)}>
            <Text style={[styles.roleButtonText, value === r ? styles.roleButtonTextActive : null]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  function ColumnSelector({ value, onChange }){
    return (
      <View style={styles.roleRow}>
        {['todo','doing','done'].map(c => (
          <TouchableOpacity key={c} style={[styles.roleButton, value === c ? styles.roleButtonActive : null]} onPress={() => onChange(c)}>
            <Text style={[styles.roleButtonText, value === c ? styles.roleButtonTextActive : null]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  const availableTabs = () => {
    if(!user) return ['kanban'];
    if(user.role === 'admin') return ['create','manage','kanban'];
    if(user.role === 'supervisor') return ['manage','kanban'];
    return ['kanban'];
  }

  if(screen === 'login') return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loginBox}>
        <Text style={styles.title}>Gerenciamento de Usuários</Text>
        <TextInput placeholder="usuario" value={username} onChangeText={setUsername} style={styles.input}/>
        <TextInput placeholder="senha" value={password} secureTextEntry onChangeText={setPassword} style={styles.input}/>
        <TouchableOpacity style={styles.primaryButton} onPress={login}>
          <Text style={styles.buttonText}>Entrar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Olá, {user?.name || user?.username} ({user?.role})</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={logout}><Text style={styles.logoutText}>Sair</Text></TouchableOpacity>
      </View>

      {/* tab bar */}
      <View style={styles.tabBar}>
        {availableTabs().includes('create') && (
          <TouchableOpacity onPress={()=>setTab('create')} style={[styles.tabButton, tab === 'create' ? styles.tabActive : null]}><Text style={styles.tabText}>Criar usuário</Text></TouchableOpacity>
        )}
        {availableTabs().includes('manage') && (
          <TouchableOpacity onPress={()=>setTab('manage')} style={[styles.tabButton, tab === 'manage' ? styles.tabActive : null]}><Text style={styles.tabText}>Gerenciar</Text></TouchableOpacity>
        )}
        {availableTabs().includes('kanban') && (
          <TouchableOpacity onPress={()=>setTab('kanban')} style={[styles.tabButton, tab === 'kanban' ? styles.tabActive : null]}><Text style={styles.tabText}>Kanban</Text></TouchableOpacity>
        )}
      </View>

      <View style={{width:'100%', alignItems:'center', paddingBottom:40}}>

        {tab === 'create' && user?.role === 'admin' && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Criar usuário</Text>
            <TextInput placeholder="Nome" value={newUserName} onChangeText={setNewUserName} style={styles.input}/>
            <TextInput placeholder="Username" value={newUserUsername} onChangeText={setNewUserUsername} style={styles.input}/>
            <TextInput placeholder="Senha" value={newUserPassword} secureTextEntry onChangeText={setNewUserPassword} style={styles.input}/>
            <Text style={{marginTop:6}}>Role</Text>
            <RoleSelector value={newUserRole} onChange={setNewUserRole} />
            <TouchableOpacity style={styles.secondaryButton} onPress={createUser}><Text style={styles.buttonText}>Criar</Text></TouchableOpacity>
          </View>
        )}

        {tab === 'manage' && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Gerenciar usuários</Text>
            <TouchableOpacity style={styles.secondaryButton} onPress={fetchUsers}><Text style={styles.buttonText}>Carregar usuários</Text></TouchableOpacity>

            {/* edit form (only for admin) */}
            {editingUser && user?.role === 'admin' && (
              <View style={{marginTop:12}}>
                <Text style={{fontWeight:'700'}}>Editando: {editingUser.username}</Text>
                <TextInput placeholder="Nome" value={editName} onChangeText={setEditName} style={styles.input}/>
                <Text style={{marginTop:6}}>Role</Text>
                <RoleSelector value={editRole} onChange={setEditRole} />
                <View style={{flexDirection:'row', marginTop:8}}>
                  <TouchableOpacity style={styles.primaryButtonSmall} onPress={saveEdit}><Text style={styles.buttonText}>Salvar</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.secondaryButtonSmall} onPress={()=>{ setEditingUser(null); setEditName(''); setEditRole('user'); }}><Text style={styles.buttonText}>Cancelar</Text></TouchableOpacity>
                </View>
              </View>
            )}

            <FlatList
              data={users}
              keyExtractor={i=>i.id}
              style={{width:'100%', marginTop:10}}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              renderItem={({item})=>(
                <View style={styles.userRow}>
                  <View style={{flex:1}}>
                    <Text style={styles.userName}>{item.name || item.username}</Text>
                    <Text style={styles.userMeta}>{item.username} • {item.role} • {item.active ? 'ativo' : 'desativado'}</Text>
                  </View>
                  <View style={{flexDirection:'row', alignItems:'center'}}>
                    {user?.role === 'admin' && (
                      <TouchableOpacity style={styles.editButton} onPress={()=>startEdit(item)}><Text style={styles.buttonText}>Editar</Text></TouchableOpacity>
                    )}
                    {(user?.role === 'admin' || user?.role === 'supervisor') && (
                      item.active ? (
                        <TouchableOpacity style={styles.dangerButton} onPress={()=>{ Alert.alert('Confirma', 'Desativar usuário?', [ {text:'Cancelar'}, {text:'OK', onPress:()=>disableUserAction(item.id)} ]); }}><Text style={styles.buttonText}>Desativar</Text></TouchableOpacity>
                      ) : (
                        <TouchableOpacity style={[styles.secondaryButtonSmall, {paddingHorizontal:10}]} onPress={()=>{ Alert.alert('Confirma', 'Ativar usuário?', [ {text:'Cancelar'}, {text:'OK', onPress:()=>activateUserAction(item.id)} ]); }}><Text style={styles.buttonText}>Ativar</Text></TouchableOpacity>
                      )
                    )}
                  </View>
                </View>
              )}
            />
          </View>
        )}

        {tab === 'kanban' && (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Kanban</Text>

            <View style={{width:'100%', marginBottom:8}}>
              <Text style={{fontWeight:'700'}}>Criar novo card</Text>
              <TextInput placeholder="Título" value={cardTitle} onChangeText={setCardTitle} style={styles.input}/>
              <TextInput placeholder="Descrição" value={cardDescription} onChangeText={setCardDescription} style={styles.input}/>
              <Text style={{marginTop:6}}>Coluna</Text>
              {/* <ColumnSelector value={cardColumn} onChange={setCardColumn} /> */}
              <TouchableOpacity style={styles.secondaryButton} onPress={createCard}><Text style={styles.buttonText}>Criar Card</Text></TouchableOpacity>
            </View>

            <Text style={[styles.panelTitle, {marginTop:12}]}>Quadro</Text>

            {/* Horizontal scroll with three columns */}
            <ScrollView horizontal style={{width:'100%'}} contentContainerStyle={{paddingHorizontal:12}}>
              {['todo','doing','done'].map(col => (
                <View key={col} style={styles.column}>
                  <Text style={styles.columnTitle}>{col.toUpperCase()}</Text>
                  <FlatList
                    data={cards.filter(c => (c.column||'todo') === col)}
                    keyExtractor={i=>i.id}
                    renderItem={renderCard}
                    nestedScrollEnabled={true}
                    keyboardShouldPersistTaps="handled"
                    style={{maxHeight:600}}
                  />
                </View>
              ))}
            </ScrollView>

            {/* edit card panel */}
            {/* edit card modal */}
            <Modal visible={!!editingCard} animationType="slide" transparent={true} onRequestClose={cancelEditCard}>
              <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.4)'}}>
                <View style={{width:'92%', maxWidth:520, backgroundColor:'#fff', borderRadius:12, padding:16}}>
                  <Text style={{fontWeight:'700'}}>Editando card</Text>
                  <TextInput placeholder="Título" value={editCardTitle} onChangeText={setEditCardTitle} style={styles.input}/>
                  <TextInput placeholder="Descrição" value={editCardDescription} onChangeText={setEditCardDescription} style={styles.input}/>
                  <Text style={{marginTop:6}}>Coluna</Text>
                  <ColumnSelector value={editCardColumn} onChange={setEditCardColumn} />
                  <View style={{flexDirection:'row', marginTop:8, justifyContent:'flex-end'}}>
                    <TouchableOpacity style={styles.primaryButtonSmall} onPress={saveEditCard}><Text style={styles.buttonText}>Salvar</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.secondaryButtonSmall, {marginLeft:8}]} onPress={cancelEditCard}><Text style={styles.buttonText}>Cancelar</Text></TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>

          </View>
        )}

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, alignItems:'center', backgroundColor:'#f4f6f8' },
  loginBox:{ width:'90%', maxWidth:420, padding:20, marginTop:60, backgroundColor:'#fff', borderRadius:12, shadowColor:'#000', shadowOpacity:0.05, shadowRadius:10 },
  title:{ fontSize:22, fontWeight:'700', textAlign:'center', marginBottom:12 },
  input:{ borderWidth:1, borderColor:'#e0e0e0', backgroundColor:'#fff', padding:10, borderRadius:8, marginVertical:6 },
  primaryButton:{ backgroundColor:'#2b8aef', padding:12, borderRadius:8, alignItems:'center', marginTop:10 },
  secondaryButton:{ backgroundColor:'#2dce89', padding:10, borderRadius:8, alignItems:'center', marginTop:8 },
  dangerButton:{ backgroundColor:'#ef5350', padding:8, borderRadius:8, alignItems:'center', marginLeft:8 },
  primaryButtonSmall:{ backgroundColor:'#2b8aef', padding:8, borderRadius:8, alignItems:'center', marginRight:8 },
  secondaryButtonSmall:{ backgroundColor:'#2dce89', padding:8, borderRadius:8, alignItems:'center' },
  editButton:{ backgroundColor:'#6c757d', padding:8, borderRadius:8, alignItems:'center', marginRight:8 },
  buttonText:{ color:'#fff', fontWeight:'600' },
  header:{ width:'100%', padding:14, flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'#fff', borderBottomWidth:1, borderColor:'#eee' },
  headerTitle:{ fontSize:16, fontWeight:'700' },
  logoutButton:{ paddingHorizontal:12, paddingVertical:6, backgroundColor:'#ef5350', borderRadius:8 },
  logoutText:{ color:'#fff', fontWeight:'600' },
  panel:{ width:'90%', maxWidth:820, backgroundColor:'#fff', padding:14, borderRadius:12, marginTop:12, shadowColor:'#000', shadowOpacity:0.03, shadowRadius:8 },
  panelTitle:{ fontSize:16, fontWeight:'700', marginBottom:8 },
  userRow:{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:8, borderBottomWidth:1, borderColor:'#f0f0f0' },
  userName:{ fontWeight:'600' },
  userMeta:{ color:'#666', fontSize:12 },
  card:{ backgroundColor:'#f9fbff', padding:12, borderRadius:10, marginVertical:6, borderWidth:1, borderColor:'#e6f0ff' },
  cardTitle:{ fontWeight:'700', marginBottom:6 },
  cardDesc:{ color:'#333', marginBottom:6 },
  cardMeta:{ color:'#666', fontSize:12 },
  tabBar:{ width:'100%', flexDirection:'row', justifyContent:'center', paddingVertical:8, backgroundColor:'#fff', borderBottomWidth:1, borderColor:'#eee' },
  tabButton:{ paddingVertical:8, paddingHorizontal:12, marginHorizontal:6, borderRadius:8 },
  tabActive:{ backgroundColor:'#e9f2ff' },
  tabText:{ fontWeight:'600' },
  roleRow:{ flexDirection:'row', marginTop:8 },
  roleButton:{ paddingVertical:6, paddingHorizontal:10, borderRadius:8, borderWidth:1, borderColor:'#ddd', marginRight:8 },
  roleButtonActive:{ backgroundColor:'#2b8aef', borderColor:'#2b8aef' },
  roleButtonText:{ color:'#333' },
  roleButtonTextActive:{ color:'#fff' },
  column:{ width:300, padding:8, marginRight:12, backgroundColor:'#fff', borderRadius:10, minHeight:370 },
  columnTitle:{ fontWeight:'700', marginBottom:8 }
});