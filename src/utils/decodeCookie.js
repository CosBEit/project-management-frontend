// import jwt from 'jsonwebtoken'
import CryptoJS from 'crypto-js'

import Cookies from 'js-cookie'
import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

export default function decodeCookie() {
    let auth = null

    // const navigate=useNavigate()
    /*---------AES SECRET KEY and Initial Vector for SYMMETRIC encryption---- */
    //Start
    const AES_SECRET_KEY = import.meta.env.VITE_CSRF_ENCRYPTION_SECRET_KEY
    const AES_IV = import.meta.env.VITE_AES_ENCRYPTION_INITIAL_VECTOR
    //End

    //JWT Secret Key
    const CSRF_TOKEN_KEY = import.meta.env.VITE_CSRF_TOKEN_SECRET_KEY

    const KEY = CryptoJS.enc.Utf8.parse(AES_SECRET_KEY)
    const IV = CryptoJS.enc.Utf8.parse(AES_IV)
    const encrypted_csrf = Cookies.get('__HOST_csrf_token')

    // useEffect(() => {})
    if (encrypted_csrf) {
        try {
            const cipher = CryptoJS.enc.Hex.parse(encrypted_csrf)
            const encryptedCP = CryptoJS.lib.CipherParams.create({
                ciphertext: cipher,
                formatter: CryptoJS.format.OpenSSL,
            })
            const decryptedWA = CryptoJS.AES.decrypt(encryptedCP, KEY, {
                iv: IV,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            })



            try {
                const decryptedUtf8 = decryptedWA.toString(CryptoJS.enc.Utf8)
                const token_secrete_key = new TextEncoder('utf-8').encode(CSRF_TOKEN_KEY)
                try {
                    auth = jwtDecode(decryptedUtf8, token_secrete_key)
                    // dispatch(LoginEmailAction(auth?.email))
                    // console.log(auth)
                    if (auth && auth._id) {
                        axios.defaults.headers.common['X-CSRF-TOKEN'] = auth._id
                    }
                } catch (err) {
                    console.log(err.message)
                    if (err.name === 'TokenExpiredError') {
                        console.log('Token Expired')
                        alert('Token Expired')



                    }
                    if (err.name === 'JsonWebTokenError') {
                        console.log('Invalid Token')
                        alert('Invalid Token')


                    }
                }
            } catch {
                console.log('Token Verify fail or session expired')
                alert('Token Verify fail or session expired')


            }
        } catch {
            console.log('Encrypted cookie is tampered or secret key miss match')
            alert('Encrypted cookie is tampered or secret key miss match')


        }
    }
    return auth
}


