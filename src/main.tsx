import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@/presentation/styles/index.css';
import { createContainer } from '@/di/container';
import { App } from '@/presentation/app/App';
import { createQueryClient } from '@/presentation/providers/queryClient';

/**
 * Composition root do navegador: o container de DI escolhe os adaptadores (backend simulado
 * ou API HTTP, conforme VITE_API_MODE) e entrega os casos de uso prontos para a apresentação.
 */
const services = createContainer();
const queryClient = createQueryClient();

const container = document.getElementById('root');
if (!container) throw new Error('Elemento #root não encontrado no index.html.');

createRoot(container).render(
  <StrictMode>
    <App services={services} queryClient={queryClient} />
  </StrictMode>,
);
