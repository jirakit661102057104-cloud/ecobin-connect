import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Reward, RedemptionSimulation } from '../types';
import { 
  Gift, 
  Coins, 
  Check, 
  ShoppingBag, 
  X, 
  CheckCircle2,
  Lock,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RewardsCatalogProps {
  openAuthModal: () => void;
  setActiveTab: (tab: string) => void;
}

export const RewardsCatalog: React.FC<RewardsCatalogProps> = ({ openAuthModal, setActiveTab }) => {
  const { currentUser, rewards, redeemReward, language } = useApp();

  const [selectedCategory, setSelectedCategory] = useState<string>('ทั้งหมด');
  const [selectedRewardToRedeem, setSelectedRewardToRedeem] = useState<Reward | null>(null);
  const [redemptionResult, setRedemptionResult] = useState<RedemptionSimulation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const categories = language === 'th' 
    ? ['ทั้งหมด', 'ของใช้รักษ์โลก', 'เครื่องดื่มและอาหาร', 'อุปกรณ์การเรียน']
    : ['All', 'Eco Lifestyle', 'Food & Beverage', 'Stationery'];

  const thToEnCatMap: Record<string, string> = {
    'ทั้งหมด': 'All',
    'ของใช้รักษ์โลก': 'Eco Lifestyle',
    'เครื่องดื่มและอาหาร': 'Food & Beverage',
    'อุปกรณ์การเรียน': 'Stationery'
  };

  const enToThCatMap: Record<string, string> = {
    'All': 'ทั้งหมด',
    'Eco Lifestyle': 'ของใช้รักษ์โลก',
    'Food & Beverage': 'เครื่องดื่มและอาหาร',
    'Stationery': 'อุปกรณ์การเรียน'
  };

  const currentThCat = language === 'th' ? selectedCategory : enToThCatMap[selectedCategory] || 'ทั้งหมด';

  const filteredRewards = currentThCat === 'ทั้งหมด' 
    ? rewards 
    : rewards.filter(r => r.category === currentThCat);

  const handleOpenRedeemModal = (reward: Reward) => {
    if (!currentUser) {
      openAuthModal();
      return;
    }
    setSelectedRewardToRedeem(reward);
    setRedemptionResult(null);
  };

  const handleConfirmRedeem = () => {
    if (!selectedRewardToRedeem) return;

    setIsProcessing(true);
    setTimeout(() => {
      const res = redeemReward(selectedRewardToRedeem.reward_id);
      setIsProcessing(false);
      if (res.success && res.redemption) {
        setRedemptionResult(res.redemption);
      }
    }, 500);
  };

  return (
    <div className="space-y-5">
      {/* Guest Notice */}
      {!currentUser && (
        <div className="bg-amber-50/80 border border-amber-200/70 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{language === 'th' ? 'เข้าสู่ระบบเพื่อแลกของรางวัล' : 'Login to redeem rewards'}</span>
          </div>
          <button
            onClick={openAuthModal}
            className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shrink-0 cursor-pointer"
          >
            {language === 'th' ? 'เข้าสู่ระบบ' : 'Login'}
          </button>
        </div>
      )}

      {/* Categories Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            id={`filter-cat-${cat}`}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/80'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredRewards.map((reward) => {
          const userPoints = currentUser ? currentUser.total_points : 0;
          const canAfford = userPoints >= reward.points_required;
          const isOutOfStock = reward.reward_stock <= 0;

          return (
            <div
              key={reward.reward_id}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-2xs hover:border-slate-200 transition-all flex flex-col group"
            >
              {/* Image box */}
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <img 
                  src={reward.reward_image} 
                  alt={reward.reward_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                />
                
                {/* Category badge */}
                <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
                  {language === 'th' ? reward.category : thToEnCatMap[reward.category] || reward.category}
                </span>

                {/* Stock badge */}
                <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur-md ${
                  isOutOfStock 
                    ? 'bg-rose-600 text-white' 
                    : reward.reward_stock < 10 
                    ? 'bg-amber-500 text-white' 
                    : 'bg-emerald-600/90 text-white'
                }`}>
                  {isOutOfStock ? (language === 'th' ? 'หมด' : 'Out of stock') : `${language === 'th' ? 'เหลือ' : 'Left'} ${reward.reward_stock}`}
                </span>
              </div>

              {/* Body Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] text-slate-400 font-mono">{reward.reward_id}</span>
                    
                    {/* Points Pill */}
                    <div className="flex items-center gap-1 text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded-md text-xs">
                      <Coins className="w-3 h-3 text-amber-500 fill-amber-400" />
                      <span>{reward.points_required}</span>
                      <span className="text-[10px] font-normal">{language === 'th' ? 'แต้ม' : 'pts'}</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {reward.reward_name}
                  </h3>

                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {reward.reward_description}
                  </p>
                </div>

                {/* Action button */}
                <div className="pt-2 border-t border-slate-50">
                  <button
                    id={`redeem-btn-${reward.reward_id}`}
                    onClick={() => handleOpenRedeemModal(reward)}
                    disabled={isOutOfStock}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      isOutOfStock
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : canAfford
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>
                      {isOutOfStock 
                        ? (language === 'th' ? 'สินค้าหมด' : 'Out of Stock')
                        : canAfford 
                        ? (language === 'th' ? 'แลกของรางวัล' : 'Redeem Reward')
                        : (language === 'th' ? `ขาดอีก ${reward.points_required - userPoints} แต้ม` : `Need ${reward.points_required - userPoints} more pts`)}
                    </span>
                  </button>
                </div>

              </div>

            </div>
          );
        })}
      </div>

      {/* Redemption Modal Dialog */}
      <AnimatePresence>
        {selectedRewardToRedeem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 relative overflow-hidden"
            >
              <button
                onClick={() => setSelectedRewardToRedeem(null)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {!redemptionResult ? (
                /* Step 1: Confirmation Form */
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <Gift className="w-5 h-5" />
                    <h3 className="text-base font-bold">{language === 'th' ? 'ยืนยันการแลกของรางวัล' : 'Confirm Redemption'}</h3>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                    <img 
                      src={selectedRewardToRedeem.reward_image} 
                      alt="" 
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs text-slate-900 truncate">
                        {selectedRewardToRedeem.reward_name}
                      </h4>
                      <div className="flex items-center gap-1 mt-1 text-xs font-bold text-amber-700">
                        <Coins className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{language === 'th' ? `ใช้ ${selectedRewardToRedeem.points_required} แต้ม` : `${selectedRewardToRedeem.points_required} pts`}</span>
                      </div>
                    </div>
                  </div>

                  {/* Points breakdown */}
                  <div className="bg-emerald-50/60 p-3.5 rounded-2xl border border-emerald-100 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-600">
                      <span>{language === 'th' ? 'แต้มปัจจุบัน:' : 'Current balance:'}</span>
                      <strong className="text-slate-900">{currentUser?.total_points} {language === 'th' ? 'แต้ม' : 'pts'}</strong>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>{language === 'th' ? 'ใช้แต้ม:' : 'Points to use:'}</span>
                      <strong>-{selectedRewardToRedeem.points_required} {language === 'th' ? 'แต้ม' : 'pts'}</strong>
                    </div>
                    <div className="pt-1.5 border-t border-emerald-100 flex justify-between font-bold text-emerald-900">
                      <span>{language === 'th' ? 'คงเหลือ:' : 'Remaining:'}</span>
                      <span>{(currentUser?.total_points || 0) - selectedRewardToRedeem.points_required} {language === 'th' ? 'แต้ม' : 'pts'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setSelectedRewardToRedeem(null)}
                      className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
                    >
                      {language === 'th' ? 'ยกเลิก' : 'Cancel'}
                    </button>
                    <button
                      id="confirm-redemption-action-btn"
                      onClick={handleConfirmRedeem}
                      disabled={isProcessing}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      {isProcessing ? (
                        <span>{language === 'th' ? 'กำลังประมวลผล...' : 'Processing...'}</span>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>{language === 'th' ? 'ยืนยันการแลก' : 'Confirm Redeem'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 2: Success & Redemption Voucher */
                <div className="space-y-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900">{language === 'th' ? 'แลกของรางวัลสำเร็จ' : 'Redemption Successful'}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {language === 'th' ? 'นำรหัสไปรับของรางวัลได้ที่จุดบริการ' : 'Present this code at the service point to claim.'}
                    </p>
                  </div>

                  {/* Voucher Card */}
                  <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 text-left space-y-2.5">
                    <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                      <span className="text-[11px] text-emerald-800 font-semibold">PCRU Eco Voucher</span>
                      <span className="text-[10px] font-mono text-emerald-900 font-bold">
                        {redemptionResult.redeem_id}
                      </span>
                    </div>

                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-slate-900">{redemptionResult.reward_name}</p>
                      <p className="text-slate-600 text-[11px]">ผู้รับ: {redemptionResult.user_name}</p>
                    </div>

                    {/* Pickup code box */}
                    <div className="bg-white p-2.5 rounded-xl border border-emerald-200 text-center">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                        รหัสรับของรางวัล
                      </span>
                      <strong className="text-base font-mono tracking-wider text-emerald-700 select-all">
                        {redemptionResult.pickup_code}
                      </strong>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedRewardToRedeem(null);
                        setActiveTab('history');
                      }}
                      className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
                    >
                      ดูประวัติ
                    </button>
                    <button
                      onClick={() => setSelectedRewardToRedeem(null)}
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      เสร็จสิ้น
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
