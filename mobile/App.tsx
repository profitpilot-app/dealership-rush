import React,{useEffect,useRef,useState} from 'react';
import {ActivityIndicator,AppState,Share,StyleSheet,Text,TouchableOpacity,View} from 'react-native';
import {SafeAreaProvider,SafeAreaView} from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {WebView,WebViewMessageEvent} from 'react-native-webview';
import gameHTML from './generated/game';
const SAVE_KEY='showroom-showdown:local-game';
export default function App(){
 const ref=useRef<WebView>(null),saveQueue=useRef(Promise.resolve());const [saved,setSaved]=useState<Record<string,string>|null>(null),[failure,setFailure]=useState(false),[revision,setRevision]=useState(0);
 useEffect(()=>{AsyncStorage.getItem(SAVE_KEY).then(raw=>{try{const parsed=JSON.parse(raw||'{}');setSaved(parsed&&typeof parsed==='object'&&!Array.isArray(parsed)?parsed:{});}catch{setSaved({});}}).catch(()=>setSaved({}));},[]);
 useEffect(()=>{const sub=AppState.addEventListener('change',state=>{ref.current?.injectJavaScript(`window.dispatchEvent(new CustomEvent('native-visibility',{detail:${JSON.stringify(state==='active')}}));true;`);});return()=>sub.remove();},[]);
 async function message(event:WebViewMessageEvent){try{const data=JSON.parse(event.nativeEvent.data);if(data.type==='save'&&typeof data.key==='string'&&data.key.startsWith('dealership-chess:')&&typeof data.value==='string'&&data.value.length<200000){setSaved(current=>{const next={...current,[data.key]:data.value};saveQueue.current=saveQueue.current.then(()=>AsyncStorage.setItem(SAVE_KEY,JSON.stringify(next))).catch(()=>{});return next;});}if(data.type==='export'&&typeof data.pgn==='string'&&data.pgn.length<200000)await Share.share({message:data.pgn,title:'Showroom Showdown game'});}catch{}}
 // Initial state is injected into the document itself, before the game starts.
 const initial=useRef<string|null>(null);if(saved!==null&&initial.current===null)initial.current=gameHTML.replace('<head>','<head><script>window.__NATIVE_SAVE__='+JSON.stringify(saved).replaceAll('<','\\u003c')+';<\/script>');
 return <SafeAreaProvider><SafeAreaView style={styles.root} edges={['top','bottom']}>
 {saved===null?<ActivityIndicator accessibilityLabel="Loading saved game" style={styles.fill}/>:failure?<View style={styles.error}><Text style={styles.title}>Let’s reopen the showroom.</Text><Text>Your last saved game is kept on this iPhone.</Text><TouchableOpacity accessibilityRole="button" style={styles.button} onPress={()=>{initial.current=null;setFailure(false);setRevision(n=>n+1);}}><Text>Try again</Text></TouchableOpacity></View>:<WebView key={revision} ref={ref} style={styles.fill} source={{html:initial.current!}} originWhitelist={['*']} javaScriptEnabled domStorageEnabled allowsInlineMediaPlayback mediaPlaybackRequiresUserAction={false} onMessage={message} onError={()=>setFailure(true)} onContentProcessDidTerminate={()=>{initial.current=null;setRevision(n=>n+1);}} onShouldStartLoadWithRequest={r=>r.url==='about:blank'||r.url.startsWith('data:text/html')} />}
 </SafeAreaView></SafeAreaProvider>;
}
const styles=StyleSheet.create({root:{flex:1,backgroundColor:'#f5f3ef'},fill:{flex:1,backgroundColor:'#f5f3ef'},error:{flex:1,justifyContent:'center',alignItems:'center',padding:24,gap:16},title:{fontSize:21,fontWeight:'700'},button:{backgroundColor:'#dedbcd',padding:16,borderRadius:10}});
