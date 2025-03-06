/* @refresh reload */
import { render } from 'solid-js/web';
import './assets/css/app.css';
import './assets/css/custom.css';

import App from './App.tsx';

const root = document.getElementById('root');

render(() => <App />, root!);
