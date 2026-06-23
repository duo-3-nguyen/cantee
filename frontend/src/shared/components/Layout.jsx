import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleLinks = {
    user: [
      { to: '/user', label: 'Thực đơn' },
      { to: '/user/cart', label: 'Giỏ hàng' },
      { to: '/user/orders', label: 'Đơn hàng' },
    ],
    staff: [
      { to: '/staff', label: 'Đơn hàng' },
      { to: '/staff/products', label: 'Sản phẩm' },
    ],
    admin: [
      { to: '/admin', label: 'Dashboard' },
      { to: '/admin/orders', label: 'Đơn hàng' },
      { to: '/admin/products', label: 'Sản phẩm' },
      { to: '/admin/users', label: 'Tài khoản' },
      { to: '/admin/settings', label: 'Cài đặt' },
    ],
  };

  const links = user ? roleLinks[user.role] || [] : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-14">
            <div className="flex items-center space-x-6">
              <Link to={user ? `/${user.role}` : '/login'} className="font-bold text-lg text-blue-600">
                🍜 Canteen
              </Link>
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end
                  className={({ isActive }) => 
                    `text-sm transition-colors ${
                      isActive 
                        ? 'text-blue-600 font-bold' // Thêm font-bold và màu xanh khi ĐANG CHỌN
                        : 'text-gray-600 hover:text-blue-600' // Trạng thái bình thường
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {user.fullName} <span className="text-xs text-gray-400">({user.role})</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</main>
    </div>
  );
}