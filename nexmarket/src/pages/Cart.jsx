import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ShoppingBag, ArrowRight, ShieldCheck, CreditCard, ChevronLeft, Check, Copy, Loader2 } from 'lucide-react';
import { dataService } from '../services/dataService';

export default function Cart() {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkoutPayment, setCheckoutPayment] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setCartItems(dataService.getCart());
    
    const handleStateChange = () => {
      setCartItems(dataService.getCart());
    };
    window.addEventListener('app-state-change', handleStateChange);
    return () => window.removeEventListener('app-state-change', handleStateChange);
  }, []);

  // Polling hook to check payment status
  useEffect(() => {
    if (!checkoutPayment) return;

    let intervalId = setInterval(async () => {
      try {
        const response = await fetch(`/api/payments/status/${checkoutPayment.paymentId}`);
        const data = await response.json();
        
        if (data.success && data.status === 'approved') {
          clearInterval(intervalId);
          setPaymentStatus('approved');
          
          // Dynamically import unified orderService and approve the order
          const { orderService } = await import('../../../src/services/orderService.js');
          for (const order of checkoutPayment.orders) {
            await orderService.approveOrder(order.id);
          }
          
          window.dispatchEvent(new Event('app-state-change'));
          
          setTimeout(() => {
            setCheckoutPayment(null);
            navigate('/profile?success=true');
          }, 2000);
        }
      } catch (err) {
        console.error("Erro ao verificar status do pagamento:", err);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [checkoutPayment, navigate]);

  const handleRemove = (cartItemId) => {
    dataService.removeFromCart(cartItemId);
    window.dispatchEvent(new Event('app-state-change'));
  };

  const handleCopyPix = () => {
    if (checkoutPayment?.qrCode) {
      navigator.clipboard.writeText(checkoutPayment.qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCheckout = async () => {
    const user = dataService.getCurrentUser();
    if (!user) {
      navigate('/login?redirect=/cart');
      return;
    }
    
    setLoading(true);
    try {
      const result = await dataService.checkout();
      if (result.success && result.orders && result.orders.length > 0) {
        // Generate the Pix key through our secure server API
        const firstOrder = result.orders[0];
        const totalAmount = result.orders.reduce((acc, order) => acc + order.total, 0);
        
        const response = await fetch('/api/payments/create-pix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            total: totalAmount,
            productName: firstOrder.productName,
            variationName: firstOrder.variationName || '',
            userName: user.nome,
            email: user.email
          })
        });

        const paymentData = await response.json();
        if (paymentData.success) {
          setCheckoutPayment({
            paymentId: paymentData.paymentId,
            qrCode: paymentData.qrCode,
            qrCodeBase64: paymentData.qrCodeBase64,
            mode: paymentData.mode,
            total: totalAmount,
            orders: result.orders
          });
          setPaymentStatus('pending');
        } else {
          alert(paymentData.error || 'Erro ao gerar pagamento Pix.');
        }
      } else {
        alert(result.message || 'Erro ao processar checkout.');
      }
    } catch (err) {
      console.error("Erro ao finalizar compra:", err);
      alert('Erro ao processar compra.');
    } finally {
      setLoading(false);
    }
  };

  const total = cartItems.reduce((acc, item) => acc + (item.price || 0) * item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div className="container-premium py-32 sm:py-48 flex justify-center">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }} 
          animate={{ scale: 1, opacity: 1 }} 
          className="card-premium max-w-lg w-full p-6 sm:p-12 text-center"
        >
          <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-6 sm:mb-8 border border-white/5 shadow-2xl">
            <ShoppingBag className="w-8 h-8 sm:w-[48px] sm:h-[48px] text-slate-700" />
          </div>
          <h2 className="text-xl sm:text-3xl font-black mb-3 sm:mb-4">Seu Carrinho está Vazio</h2>
          <p className="text-slate-500 mb-6 sm:mb-10 text-xs sm:text-sm font-medium leading-relaxed">Você ainda não adicionou nenhum produto ao seu carrinho.</p>
          <Link to="/" className="btn-premium btn-premium-primary w-full text-sm sm:text-base">
            Explorar Loja
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container-premium pt-[88px] sm:pt-32 pb-32">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
        <div>
          <h1 className="premium-title !mb-1 text-3xl">Meu <span className="text-gradient-blue">Carrinho</span></h1>
          <p className="premium-subtitle">Você tem {cartItems.reduce((a, b) => a + b.quantity, 0)} itens selecionados</p>
        </div>
        <Link to="/" className="btn-premium btn-premium-secondary !py-2 !px-5 !text-[11px]">
          <ChevronLeft size={16} strokeWidth={3} /> Continuar Comprando
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-12 items-start">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence>
            {cartItems.map((item, index) => (
              <motion.div 
                key={item.cartItemId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card-premium p-4 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 border-white/5 bg-dark-900/40 hover:bg-dark-900/60 transition-colors"
              >
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 border border-white/5 p-1 bg-dark-800">
                  <img src={item.icone} alt={item.nome} className="w-full h-full object-cover rounded-lg" />
                </div>
                
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-base sm:text-xl font-black mb-1 leading-tight">{item.nome}</h3>
                  {item.variation && (
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg bg-accent-blue/10 text-accent-blue text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-2 sm:mb-4">
                      {item.variation.nome}
                    </div>
                  )}
                  <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-4 mt-1">
                    <span className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Qtd: {item.quantity}</span>
                    <div className="h-3 w-px bg-white/10" />
                    <div className="text-accent-blue font-black text-base sm:text-xl tracking-tighter">
                      <span className="text-[10px] sm:text-sm mr-0.5 font-bold">R$</span>{((item.price || 0) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleRemove(item.cartItemId)}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center shadow-lg active:scale-95 flex-shrink-0"
                >
                  <Trash2 size={16} className="sm:w-[20px] sm:h-[20px]" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:sticky lg:top-32"
        >
          <div className="card-premium p-5 sm:p-8 border-accent-blue/10 bg-accent-blue/[0.02] relative overflow-hidden">
            <h2 className="text-lg sm:text-xl font-black mb-5 sm:mb-8 border-b border-white/5 pb-3 sm:pb-4">Resumo do Pedido</h2>
            
            <div className="space-y-3 sm:space-y-4 mb-5 sm:mb-8">
              <div className="flex justify-between text-slate-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest">
                <span>Subtotal</span>
                <span className="text-white">R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest">
                <span>Descontos</span>
                <span className="text-green-500">R$ 0.00</span>
              </div>
            </div>
            
            <div className="pt-4 sm:pt-6 border-t border-white/5 mb-5 sm:mb-8">
              <div className="flex justify-between items-baseline">
                <span className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">Total</span>
                <span className="text-2xl sm:text-4xl font-black text-accent-blue tracking-tighter">
                  R$ {total.toFixed(2)}
                </span>
              </div>
            </div>

            <button 
              onClick={handleCheckout} 
              className="btn-premium btn-premium-primary w-full !py-3 sm:!py-4 text-sm sm:text-base mb-4 sm:mb-6 shadow-glow-blue"
            >
              Finalizar Pedido <ArrowRight size={16} className="sm:w-[20px] sm:h-[20px]" strokeWidth={3} />
            </button>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3 text-slate-400 text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                <ShieldCheck size={14} className="sm:w-[16px] sm:h-[16px] text-green-500" /> Pagamento 100% Seguro
              </div>
              <div className="flex items-center gap-3 text-slate-400 text-[8px] sm:text-[9px] font-black uppercase tracking-widest">
                <CreditCard size={14} className="sm:w-[16px] sm:h-[16px] text-accent-blue" /> PIX, Cartão ou Boleto
              </div>
            </div>

            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-accent-blue/5 blur-[80px] rounded-full" />
          </div>
          
          <div className="mt-6 p-4 card-premium border-white/5 bg-white/[0.02] flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/20 flex items-center justify-center text-accent-blue flex-shrink-0 font-black text-sm">
              !
            </div>
            <p className="text-[9px] text-slate-400 leading-relaxed font-bold uppercase tracking-widest">
              Sua entrega será processada imediatamente após a confirmação do pagamento.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Mercado Pago Pix Checkout Modal */}
      <AnimatePresence>
        {checkoutPayment && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-dark-950/90 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="card-premium max-w-md w-full p-6 border-accent-blue/20 bg-dark-900/90 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden text-center"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-blue/10 text-accent-blue text-[9px] font-black uppercase tracking-widest mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
                {checkoutPayment.mode === 'demo' ? 'Modo de Demonstração' : 'Aguardando Pagamento Pix'}
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight">Checkout Expresso</h2>
              <p className="text-slate-400 text-[11px] font-medium leading-relaxed mb-6 max-w-xs mx-auto">
                Escaneie o QR Code abaixo pelo aplicativo do seu banco ou use a chave Copia e Cola para pagar.
              </p>

              {/* Total Amount */}
              <div className="card-premium py-4 px-6 border-white/5 bg-white/[0.02] mb-6 flex justify-between items-center text-left">
                <div>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none font-black">Total do Pedido</span>
                  <div className="text-2xl font-black text-white leading-tight">
                    <span className="text-xs text-accent-blue mr-0.5">R$</span>{checkoutPayment.total.toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-none font-black">Itens</span>
                  <div className="text-xs font-black text-slate-300 leading-tight">{checkoutPayment.orders.length} unidade(s)</div>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="relative w-48 h-48 mx-auto mb-6 bg-white rounded-2xl p-3 shadow-2xl flex items-center justify-center border border-white/10 overflow-hidden">
                {paymentStatus === 'approved' ? (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 bg-green-500 flex flex-col items-center justify-center text-dark-950 p-4"
                  >
                    <div className="w-12 h-12 rounded-full bg-dark-950 flex items-center justify-center text-green-500 mb-2 shadow-lg">
                      <Check size={28} strokeWidth={4} />
                    </div>
                    <span className="font-black uppercase text-[10px] tracking-wider text-dark-950">Pago com Sucesso!</span>
                    <span className="text-[8px] font-bold text-dark-950/70 mt-1 uppercase">Liberando entrega...</span>
                  </motion.div>
                ) : (
                  <img 
                    src={checkoutPayment.qrCodeBase64.startsWith('data:') ? checkoutPayment.qrCodeBase64 : `data:image/png;base64,${checkoutPayment.qrCodeBase64}`} 
                    alt="Pix QR Code" 
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              {/* Action Buttons */}
              {paymentStatus !== 'approved' && (
                <div className="space-y-3 mb-6">
                  <button 
                    onClick={handleCopyPix}
                    className="w-full btn-premium btn-premium-primary !py-3 text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-glow-blue"
                  >
                    {copied ? (
                      <>
                        <Check size={16} strokeWidth={3} className="text-green-500 animate-bounce" /> Copiado!
                      </>
                    ) : (
                      <>
                        <Copy size={16} strokeWidth={2.5} /> Copiar Chave Pix
                      </>
                    )}
                  </button>
                  
                  <button 
                    onClick={() => setCheckoutPayment(null)}
                    className="w-full btn-premium btn-premium-secondary !py-2.5 text-xs text-slate-400 hover:text-white"
                  >
                    Cancelar e Voltar
                  </button>
                </div>
              )}

              {/* Status Polling Indicator */}
              <div className="flex items-center justify-center gap-2 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                {paymentStatus === 'approved' ? (
                  <span className="text-green-500 animate-pulse font-black">Redirecionando...</span>
                ) : (
                  <>
                    <Loader2 size={12} className="animate-spin text-accent-blue" />
                    <span>Verificando pagamento automaticamente...</span>
                  </>
                )}
              </div>

              {/* Demo Mode Notice */}
              {checkoutPayment.mode === 'demo' && paymentStatus !== 'approved' && (
                <div className="mt-4 p-2.5 rounded-lg border border-yellow-500/10 bg-yellow-500/5 text-[8px] text-yellow-500 font-bold uppercase tracking-wider leading-relaxed">
                  ⚠️ Nenhuma credencial do Mercado Pago configurada. Aprovando automaticamente em 4 segundos para testes.
                </div>
              )}

              {/* Background Glow */}
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-accent-blue/5 blur-[80px] rounded-full" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
