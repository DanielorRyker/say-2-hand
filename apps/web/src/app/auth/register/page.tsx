'use client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import styleLogin from '@/styles/login.module.css'
import styleRegister from '@/styles/register.module.css'

const Home =()=>{

    const router = useRouter()

    const handleBtn=()=>{
        router.push("/auth/login")
    }

    return(
        <div className={styleLogin['container']}>
            <div className={styleRegister['card']}>
                <div>
                    <p className={styleLogin['title']}>Đăng ký tài khoản</p>
                </div>

                <div className={styleLogin['gradientBorder']} >
                    <input
                        type="text"
                        placeholder="Nhập họ và tên"
                        className={styleLogin['input']}
                    />
                </div>

                <div className={styleLogin['gradientBorder']} >
                    <input
                        type="text"
                        placeholder="Nhập Email hoặc số điện thoại"
                        className={styleLogin['input']}
                    />
                </div>

                <div className={styleLogin['gradientBorder']}>
                    <input
                        type="password"
                        placeholder="Nhập mật khẩu"
                        className={styleLogin['input_password']}
                    />
                    <img
                        src="/image/login/mdi_eye-off.png"
                        alt="Toggle visibility"
                        className={styleLogin['eyeIcon']}
                    />
                </div>
                <div className={styleLogin['gradientBorder']}>
                    <input
                        type="password"
                        placeholder="Nhập lại mật khẩu"
                        className={styleLogin['input_password']}
                    />
                    <img
                        src="/image/login/mdi_eye-off.png"
                        alt="Toggle visibility"
                        className={styleLogin['eyeIcon']}
                    />
                </div>

                <div className={styleRegister['gridContainer']}>
                    <div className={styleRegister['frame1']}>
                        <img src="/image/register/VectorCheckOff.svg" alt="" className={styleRegister['checkIcon']}/> 
                        <p>Giới hạn từ 8-32 ký tự</p>
                    </div>
                    <div className={styleRegister['frame1']}>
                        <img src="/image/register/VectorCheckOff.svg" alt="" className={styleRegister['checkIcon']}/> 
                        <p>Tối thiểu 01 chữ số</p>
                    </div>
                    <div className={styleRegister['frame1']}>
                        <img src="/image/register/VectorCheckOff.svg" alt="" className={styleRegister['checkIcon']}/> 
                        <p>Tối thiểu 01 ký tự IN HOA</p>
                    </div>
                    <div className={styleRegister['frame1']}>
                        <img src="/image/register/VectorCheckOff.svg" alt="" className={styleRegister['checkIcon']}/> 
                        <p>Tối thiểu 01 ký tự in thường</p>
                    </div>
                </div>

                <div style={{display:'flex', fontSize:16,gap: 10}}>
                    <label className={styleRegister['custom-checkbox']}>
                        <input type="checkbox" />
                        <span className={styleRegister['checkmark']} ></span>
                    </label>

                    <p>Bằng việc Đăng ký, bạn đã đọc và đồng ý với Điều khoản sử dụng và Chính sách bảo mật của Say2Hand</p>
                </div>

                <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
                    <button className={styleLogin['btnLogin']}   ><p style={{fontSize: '28px',fontWeight: 'bold',}}>Tạo tài khoản</p></button>
                </div>

                <div className={styleLogin['cardline']}>
                    <div className={styleLogin['line']} ></div>
                            <span className={styleLogin['linetext']}>
                                Hoặc đăng nhập bằng
                            </span>
                     <div className={styleLogin['line']} ></div>
                </div>

                <div style={{display:'flex',gap:10}}>
                    <button className={styleLogin['btnIcon']} >
                            <img src="/image/login/IconGoogle.png" alt="Google" className={styleLogin['imgIcon']} />
                    </button>
                    <button className={styleLogin['btnIcon']} >
                            <img src="/image/login/IconFacebook.png" alt="Facebook" className={styleLogin['imgIcon']} />
                    </button>
                </div>

                <div style={{display:'flex'}}>
                    <p style={{fontWeight:'bold',fontSize:18}}>Bạn đã có có tài khoản ? </p>
                    <Link href="/auth/login" style={{fontWeight:'bold',fontSize:18, color:'#3B82F6'}}> Đăng nhập ngay</Link>
                </div>
            </div>          
        </div>
        
       
    )
}



export default Home;