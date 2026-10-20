import { motion } from 'framer-motion';

export default function PageLoader() {
  return <motion.div className="route-loader" initial={{ scaleX: 0, opacity: 1 }} animate={{ scaleX: 1, opacity: 0 }} transition={{ duration: 0.52, ease: [0.76, 0, 0.24, 1] }} />;
}
