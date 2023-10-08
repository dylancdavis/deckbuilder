(ns deckbuilder.subs
  (:require
   [re-frame.core :as re-frame]))

(re-frame/reg-sub
 ::round
 (fn [db]
   (:round db)))

(re-frame/reg-sub
 ::resources
 (fn [db]
   (:resources db)))
