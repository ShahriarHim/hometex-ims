import Providers from './Providers';
import AppRouter from '../router/AppRouter';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../assets/css/style.scss';

export default function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}
