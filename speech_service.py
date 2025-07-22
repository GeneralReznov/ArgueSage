import os
import json
import logging
import requests
import tempfile
from typing import Dict, List, Any, Optional
from gtts import gTTS
from pydub import AudioSegment
import speech_recognition as sr
from io import BytesIO
import base64

logger = logging.getLogger(__name__)

class SpeechService:
    """Multi-lingual speech service with Sarvam AI for STT and gTTS for TTS"""
    
    def __init__(self):
        os.environ['GEMINI_API_KEY'] = "AIzaSyCZGGDVIyjebUyHX8m0xO6f1pBD6KKjErc"
        os.environ['SARVAM_API_KEY'] = "sk_wq9yiszy_Jewt6e5hC7N99X4khkVVNE7m"
        self.sarvam_api_key = os.environ['SARVAM_API_KEY']
        self.gemini_api_key = os.environ['GEMINI_API_KEY']
        
        # Supported languages - English first as default
        self.supported_languages = {
            'en': {'name': 'English', 'tts_code': 'en', 'sarvam_code': 'en'},
            'hi': {'name': 'हिंदी (Hindi)', 'tts_code': 'hi', 'sarvam_code': 'hi'},
            'bn': {'name': 'বাংলা (Bengali)', 'tts_code': 'bn', 'sarvam_code': 'bn'},
            'ta': {'name': 'தமিழ் (Tamil)', 'tts_code': 'ta', 'sarvam_code': 'ta'},
            'te': {'name': 'తెలుగు (Telugu)', 'tts_code': 'te', 'sarvam_code': 'te'},
            'mr': {'name': 'मराठी (Marathi)', 'tts_code': 'mr', 'sarvam_code': 'mr'},
            'gu': {'name': 'ગુજરાતી (Gujarati)', 'tts_code': 'gu', 'sarvam_code': 'gu'},
            'kn': {'name': 'ಕನ್ನಡ (Kannada)', 'tts_code': 'kn', 'sarvam_code': 'kn'},
            'ml': {'name': 'മലയാളം (Malayalam)', 'tts_code': 'ml', 'sarvam_code': 'ml'},
            'pa': {'name': 'ਪੰਜਾਬੀ (Punjabi)', 'tts_code': 'pa', 'sarvam_code': 'pa'},
            'or': {'name': 'ଓଡ଼ିଆ (Odia)', 'tts_code': 'or', 'sarvam_code': 'or'},
            'as': {'name': 'অসমীয়া (Assamese)', 'tts_code': 'as', 'sarvam_code': 'as'},
            'ur': {'name': 'اردو (Urdu)', 'tts_code': 'ur', 'sarvam_code': 'ur'},
            'ne': {'name': 'नेपाली (Nepali)', 'tts_code': 'ne', 'sarvam_code': 'ne'},
            'si': {'name': 'සිංහල (Sinhala)', 'tts_code': 'si', 'sarvam_code': 'si'}
        }
        self.current_language = 'en'
        self.recognizer = sr.Recognizer()
        
    def get_supported_languages(self) -> Dict[str, Dict[str, str]]:
        """Get list of supported languages"""
        return self.supported_languages
    
    def speech_to_text_sarvam(self, audio_data: bytes, language: str = 'en') -> Dict[str, Any]:
        """Convert speech to text using Sarvam AI"""
        try:
            if not self.sarvam_api_key:
                logger.warning("Sarvam API key not found, falling back to Google Speech Recognition")
                return self._fallback_speech_to_text(audio_data, language)
            
            # Prepare the request for Sarvam AI
            url = "https://api.sarvam.ai/speech-to-text"
            
            headers = {
                "Authorization": f"Bearer {self.sarvam_api_key}",
                "Content-Type": "application/json"
            }
            
            # Convert audio to base64
            audio_base64 = base64.b64encode(audio_data).decode('utf-8')
            
            payload = {
                "audio": audio_base64,
                "language": self.supported_languages.get(language, {}).get('sarvam_code', 'en'),
                "model": "saaras:v1"
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    'success': True,
                    'text': result.get('text', ''),
                    'confidence': result.get('confidence', 0.9),
                    'language': language,
                    'service': 'sarvam'
                }
            else:
                logger.error(f"Sarvam API error: {response.status_code} - {response.text}")
                return self._fallback_speech_to_text(audio_data, language)
                
        except Exception as e:
            logger.error(f"Error in Sarvam speech-to-text: {e}")
            return self._fallback_speech_to_text(audio_data, language)
    
    def _fallback_speech_to_text(self, audio_data: bytes, language: str) -> Dict[str, Any]:
        """Fallback speech-to-text using Google Speech Recognition"""
        try:
            # Save audio data to temporary file
            with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as tmp_file:
                tmp_file.write(audio_data)
                tmp_file_path = tmp_file.name
            
            # Convert audio to WAV format using pydub
            try:
                # Try to load as webm first (common MediaRecorder format)
                audio_segment = AudioSegment.from_file(tmp_file_path, format="webm")
            except:
                try:
                    # Try as ogg
                    audio_segment = AudioSegment.from_file(tmp_file_path, format="ogg")
                except:
                    try:
                        # Try as mp4
                        audio_segment = AudioSegment.from_file(tmp_file_path, format="mp4")
                    except:
                        # Try as wav
                        audio_segment = AudioSegment.from_file(tmp_file_path, format="wav")
            
            # Convert to WAV format for speech recognition
            wav_path = tmp_file_path.replace('.webm', '.wav')
            audio_segment.export(wav_path, format="wav")
            
            # Load audio file for speech recognition
            with sr.AudioFile(wav_path) as source:
                audio = self.recognizer.record(source)
            
            # Convert to text
            google_lang_code = self.supported_languages.get(language, {}).get('tts_code', 'en')
            text = self.recognizer.recognize_google(audio, language=google_lang_code)
            
            # Clean up temp files
            os.unlink(tmp_file_path)
            if os.path.exists(wav_path):
                os.unlink(wav_path)
            
            return {
                'success': True,
                'text': text,
                'confidence': 0.85,
                'language': language,
                'service': 'google'
            }
            
        except sr.UnknownValueError:
            return {
                'success': False,
                'error': 'Could not understand audio',
                'language': language,
                'service': 'google'
            }
        except sr.RequestError as e:
            return {
                'success': False,
                'error': f'Speech recognition service error: {e}',
                'language': language,
                'service': 'google'
            }
        except Exception as e:
            logger.error(f"Error in fallback speech-to-text: {e}")
            return {
                'success': False,
                'error': str(e),
                'language': language,
                'service': 'google'
            }
    
    def text_to_speech(self, text: str, language: str = 'en') -> Dict[str, Any]:
        """Convert text to speech using gTTS"""
        try:
            if not text.strip():
                return {
                    'success': False,
                    'error': 'Empty text provided'
                }
            
            # Get language code for TTS
            lang_code = self.supported_languages.get(language, {}).get('tts_code', 'en')
            
            # Create TTS object
            tts = gTTS(text=text, lang=lang_code, slow=False)
            
            # Save to BytesIO buffer
            audio_buffer = BytesIO()
            tts.write_to_fp(audio_buffer)
            audio_buffer.seek(0)
            
            # Convert to base64 for frontend
            audio_base64 = base64.b64encode(audio_buffer.read()).decode('utf-8')
            
            return {
                'success': True,
                'audio_data': audio_base64,
                'language': language,
                'service': 'gtts'
            }
            
        except Exception as e:
            logger.error(f"Error in text-to-speech: {e}")
            return {
                'success': False,
                'error': str(e),
                'language': language,
                'service': 'gtts'
            }
    
    def translate_text(self, text: str, source_lang: str, target_lang: str) -> Dict[str, Any]:
        """Translate text using Gemini API"""
        try:
            if not self.gemini_api_key:
                return {
                    'success': False,
                    'error': 'Gemini API key not configured'
                }
            
            source_name = self.supported_languages.get(source_lang, {}).get('name', source_lang)
            target_name = self.supported_languages.get(target_lang, {}).get('name', target_lang)
            
            prompt = f"""
            Translate the following text from {source_name} to {target_name}:
            
            Text: {text}
            
            Please provide only the translation, no additional text or explanation.
            """
            
            # Use Gemini API for translation
            from google import genai
            client = genai.Client(api_key=self.gemini_api_key)
            
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt
            )
            
            if response.text:
                return {
                    'success': True,
                    'translated_text': response.text.strip(),
                    'source_language': source_lang,
                    'target_language': target_lang,
                    'service': 'gemini'
                }
            else:
                return {
                    'success': False,
                    'error': 'No translation received',
                    'service': 'gemini'
                }
                
        except Exception as e:
            logger.error(f"Error in text translation: {e}")
            return {
                'success': False,
                'error': str(e),
                'service': 'gemini'
            }
    
    def get_language_info(self, lang_code: str) -> Dict[str, str]:
        """Get language information"""
        return self.supported_languages.get(lang_code, {
            'name': 'Unknown',
            'tts_code': 'en',
            'sarvam_code': 'en'
        })
    
    def detect_language(self, text: str) -> Dict[str, Any]:
        """Detect language of text using simple heuristics"""
        try:
            # Simple character-based detection for Indian languages
            if any(char in text for char in 'आएईओऊअकगचछजझटठडढणतथदधनपफबभमयरलवशषसह'):
                return {'language': 'hi', 'confidence': 0.9}
            elif any(char in text for char in 'অআইঈউঊএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহ'):
                return {'language': 'bn', 'confidence': 0.9}
            elif any(char in text for char in 'அஆஇஈஉஊஎஏஐஒஓஔகங்சஞடணதநபமயரலவழளறன'):
                return {'language': 'ta', 'confidence': 0.9}
            elif any(char in text for char in 'అఆఇఈఉఊఎఏఐఒఓఔకఖగఘఙచఛజఝఞటఠడఢణతథదధనపఫబభమయరలవశషసహ'):
                return {'language': 'te', 'confidence': 0.9}
            elif any(char in text for char in 'ಅಆಇಈಉಊಎಏಐಒಓಔಕಖಗಘಙಚಛಜಝಞಟಠಡಢಣತಥದಧನಪಫಬಭಮಯರಲವಶಷಸಹ'):
                return {'language': 'kn', 'confidence': 0.9}
            elif any(char in text for char in 'അആഇഈഉഊഋഎഏഐഒഓഔകഖഗഘങചഛജഝഞടഠഡഢണതഥദധനപഫബഭമയരലവശഷസഹ'):
                return {'language': 'ml', 'confidence': 0.9}
            elif any(char in text for char in 'અઆઇઈઉઊએઐઓઔકખગઘચછજઝટઠડઢણતથદધનપફબભમયરલવશષસહ'):
                return {'language': 'gu', 'confidence': 0.9}
            elif any(char in text for char in 'ਅਆਇਈਉਊਏਐਓਔਕਖਗਘਙਚਛਜਝਞਟਠਡਢਣਤਥਦਧਨਪਫਬਭਮਯਰਲਵਸ਼ਸਹ'):
                return {'language': 'pa', 'confidence': 0.9}
            elif any(char in text for char in 'اآبتثجحخدذرزسشصضطظعغفقکگلمنہوی'):
                return {'language': 'ur', 'confidence': 0.9}
            else:
                return {'language': 'en', 'confidence': 0.7}
                
        except Exception as e:
            logger.error(f"Error in language detection: {e}")
            return {'language': 'en', 'confidence': 0.5}