import './styles/animate.css';
import './styles/theme.css';
import './styles/bs-overwrite.css';
import './styles/global.css';
import './styles/style.css';
import { Struct } from 'drizzle-struct/front-end';
import { Requests } from './utils/requests';
Struct.headers.set('X-Tab-Id', Requests.tabId);