import React from 'react';
import { useDelivery } from '../context/DeliveryContext';
import { Card, Button } from '../components/UIComponents';
import { Moon, Sun, Trash2, LogOut, Shield, Database } from 'lucide-react';

interface SettingItemProps {
  icon: React.ElementType;
  label: string;
  action: () => void;
  danger?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon: Icon, label, action, danger = false }) => (
  <button 
    onClick={action}
    className="w-full flex items-center justify-between p-4 bg-white dark:bg-dark-surface border-b border-gray-100 dark:border-dark-border last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
  >
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${danger ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <span className={`font-medium ${danger ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>{label}</span>
    </div>
  </button>
);

const Settings = () => {
  const { isDarkMode, toggleTheme, clearPendingDeliveries } = useDelivery();

  return (
    <div className="p-6 pb-24">
      <h1 className="text-2xl font-bold dark:text-white mb-6">Ajustes</h1>

      <div className="space-y-6">
        <section>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Aparência</h2>
          <Card className="p-0 overflow-hidden">
            <SettingItem 
              icon={isDarkMode ? Sun : Moon} 
              label={isDarkMode ? "Modo Claro" : "Modo Escuro"} 
              action={toggleTheme} 
            />
          </Card>
        </section>

        <section>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Dados & Armazenamento</h2>
          <Card className="p-0 overflow-hidden">
            <SettingItem 
              icon={Database} 
              label="Backup na Nuvem" 
              action={() => alert('Backup iniciado...')} 
            />
            <SettingItem 
              icon={Trash2} 
              label="Limpar Entregas Pendentes" 
              action={() => {
                if(window.confirm('Tem certeza que deseja remover TODAS as entregas pendentes? Esta ação não pode ser desfeita.')) clearPendingDeliveries();
              }}
              danger 
            />
          </Card>
        </section>

        <section>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Conta</h2>
          <Card className="p-0 overflow-hidden">
            <SettingItem icon={Shield} label="Privacidade & Segurança" action={() => {}} />
            <SettingItem icon={LogOut} label="Sair do Aplicativo" action={() => alert('Saindo...')} danger />
          </Card>
        </section>

        <div className="text-center text-xs text-gray-400 mt-8">
          RL EXPRESS v1.0.0<br/>
          Desenvolvido com React & Gemini AI
        </div>
      </div>
    </div>
  );
};

export default Settings;