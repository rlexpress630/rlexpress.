import React from 'react';
import { useDelivery } from '../context/DeliveryContext';
import { DeliveryStatus } from '../types';
import { Card } from '../components/UIComponents';
import { Package, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const { deliveries } = useDelivery();
  const navigate = useNavigate();

  const pending = deliveries.filter(d => d.status === DeliveryStatus.PENDING);
  const completed = deliveries.filter(d => d.status === DeliveryStatus.COMPLETED);
  
  // Basic efficiency calc (mock)
  const efficiency = completed.length > 0 ? '98%' : '0%';

  const StatCard = ({ title, value, icon: Icon, color, onClick }: any) => (
    <div onClick={onClick} className="cursor-pointer">
      <Card className="h-full flex flex-col justify-between hover:border-primary/50 transition-colors">
        <div className="flex justify-between items-start mb-2">
          <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
          </div>
          <span className="text-2xl font-bold dark:text-white">{value}</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
      </Card>
    </div>
  );

  return (
    <div className="p-6">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black italic tracking-tighter text-gray-900 dark:text-white">
            RL <span className="text-primary">EXPRESS</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Painel do Entregador</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden border-2 border-primary">
          <img src="https://picsum.photos/100/100" alt="Avatar" className="w-full h-full object-cover" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <StatCard 
          title="Pendentes" 
          value={pending.length} 
          icon={Clock} 
          color="bg-yellow-500 text-yellow-600"
          onClick={() => navigate('/active')}
        />
        <StatCard 
          title="Concluídas" 
          value={completed.length} 
          icon={CheckCircle} 
          color="bg-green-500 text-green-600"
          onClick={() => navigate('/history')}
        />
        <StatCard 
          title="Total Hoje" 
          value={deliveries.length} 
          icon={Package} 
          color="bg-blue-500 text-blue-600" 
        />
        <StatCard 
          title="Eficiência" 
          value={efficiency} 
          icon={TrendingUp} 
          color="bg-purple-500 text-purple-600" 
        />
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold dark:text-white">Próximas Entregas</h2>
        <button 
          onClick={() => navigate('/active')}
          className="text-sm text-primary font-semibold hover:underline"
        >
          Ver todas
        </button>
      </div>

      <div className="space-y-3">
        {pending.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-dark-surface rounded-2xl border border-dashed border-gray-300 dark:border-dark-border">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">Nenhuma entrega pendente.</p>
            <button onClick={() => navigate('/add')} className="mt-2 text-primary font-bold text-sm">Adicionar Agora</button>
          </div>
        ) : (
          pending.slice(0, 3).map(delivery => (
            <Card key={delivery.id} className="flex items-center p-4 active:scale-98 transition-transform" >
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 dark:text-white truncate">{delivery.customerName}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{delivery.address.fullAddress}</p>
              </div>
              <div className="bg-gray-100 dark:bg-dark-bg p-2 rounded-lg">
                <Clock className="w-5 h-5 text-gray-500" />
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Home;