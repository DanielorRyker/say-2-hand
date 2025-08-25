
'use client'
import NavDropdown from 'react-bootstrap/NavDropdown';
import { Navbar, Container, Nav } from 'react-bootstrap'
import "@/styles/globals.css";
import { useRouter } from "next/navigation";
import { useEffect, useState } from 'react';
import { Span } from 'next/dist/trace';

const header=()=>{

  const router = useRouter();

    const [user, setUser] = useState<{
    _id: string;
    email: string;
    full_name: string;
    role: string;
  } | null>(null);

  useEffect(() => {
    // chạy ở client sau khi render
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleBtn = () => {
    router.push("/auth/login");
  };

    const [selectedItem, setSelectedItem] = useState('Tp. Hồ Chí Minh'); // Tiêu đề ban đầu


  const handleSelect = (value: string) => {
    setSelectedItem(value);
  };
//Đăng xuất
  const handleLogout = () => {
    // Xóa toàn bộ localStorage
    localStorage.clear();
    router.push("/auth/login");
  }
  //Đăng ký
  const handleRegister = () => {
    // Xóa toàn bộ localStorage
   
    router.push("/auth/register");
  }

  return (
    <div className='headerContainer'>
      <div style={{display:'flex'}}>
      <div className='group1'>
        <NavDropdown
        className="dropDownCar"
        title={<img src="/image/header/pajamas_hamburger.svg" alt="" className='img' />}
        id="basic-nav-dropdown">
          <NavDropdown.Item href="#action/1"><h5>Danh mục</h5></NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item href="#action/1">Xe cộ</NavDropdown.Item>
          <NavDropdown.Item href="#action/2">Đồ điện tử</NavDropdown.Item>
          <NavDropdown.Item href="#action/3">Thú cưng</NavDropdown.Item>
          <NavDropdown.Item href="#action/3">Mẹ và bé</NavDropdown.Item>
          <NavDropdown.Item href="#action/3">Đồ gia dụng</NavDropdown.Item>
          <NavDropdown.Item href="#action/3">Sách </NavDropdown.Item>
      </NavDropdown>
      <img src="/image/header/Say2Hand.svg" alt="" width={200} height={45} />
      </div>

      

      <div className='group2'>
        <button className='btnHeader'><img src="/image/header/Favourite icon.svg" alt="" className='img'/></button>
        <button className='btnHeader'><img src="/image/header/Icon Message.svg" alt="" className='img'/></button>
        <button className='btnHeader'><img src="/image/header/Notification Icon.svg" alt="" className='img'/></button>

          {user ? (
            <>
              <button className='btnLogin'><p style={{fontSize:'18px',fontWeight:'bold',margin:'10px'}}>Đăng tin</p></button>
            </>
          ) : (
           <button className='btnLogin'onClick={()=> handleBtn()}><p style={{fontSize:'18px',fontWeight:'bold',margin:'10px'}}>Đăng nhập</p></button>
          )}
      
        
        <NavDropdown
        className="userDropDown"
        title={       
        <span style={{display:'flex',gap:25,justifyContent:'center',alignItems:'center'}}>
          <img src="/image/header/carbon_user-avatar-filled-alt.svg" alt="" className='imgAvatar' /> 
          <img src="/image/header/arrow-down.svg" alt="" className='img' /> 
        </span>
      }
        id="basic-nav-dropdown">
          
          {/* <NavDropdown.Item onClick={handleLogout}>Đăng nhập</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item onClick={handleRegister}>Đăng ký</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item href="#action/2" >Cài đặt tài khoản</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item onClick={handleLogout}>Đăng xuất</NavDropdown.Item> */}
          {/* Nếu chưa login thì hiện Đăng nhập + Đăng ký */}
      {!user && (
        <>
          <NavDropdown.Item onClick={handleLogout}>Đăng nhập</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item onClick={handleRegister}>Đăng ký</NavDropdown.Item>
        </>
      )}

      {/* Nếu có user thì hiện Cài đặt tài khoản + Đăng xuất */}
      {user && (
        <>
          <NavDropdown.Item >Cài đặt tài khoản</NavDropdown.Item>
          <NavDropdown.Divider />
          <NavDropdown.Item onClick={handleLogout}>Đăng xuất</NavDropdown.Item>
        </>
      )}

      </NavDropdown>
      </div>

      </div>

      <div className='group3'>
        <img src="/image/header/search_gray.svg" alt="" className='img'/>
        <input type="text" className='inputSearch' placeholder="Tìm kiếm sản phẩm ..."/>
        <div className='locationDropDownWrapper'>
            <NavDropdown
            className='locationDropDown'
            title={  
              <span style={{display:'flex',gap:10,justifyContent:'center',alignItems:'center'}}>
                <img src="/image/header/location 1.svg" alt="" className='imgLocation' /> 
                <p style={{fontSize:'18px',fontWeight:'bold',marginTop:15}}>{selectedItem}</p>
              </span>
            
          }
            id="basic-nav-dropdown">
              <NavDropdown.Item onClick={() => handleSelect('Hà nội')}> Hà nội</NavDropdown.Item>
              <NavDropdown.Item onClick={() => handleSelect('Vĩnh Long')}> Vĩnh Long </NavDropdown.Item>
              <NavDropdown.Item onClick={() => handleSelect('Cần thơ')}>Cần thơ </NavDropdown.Item>
              <NavDropdown.Item onClick={() => handleSelect('Thanh hóa')}>Thanh hóa</NavDropdown.Item>
          </NavDropdown>
        </div>
        

         <button  className='btnSearch'><img src="/image/header/search_black.svg" alt="" className='img'/></button>
      </div>

    </div>
    
    
  );
}

export default header;