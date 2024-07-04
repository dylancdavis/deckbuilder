(ns deckbuilder.subs
  (:require
   [re-frame.core :as re-frame]))

(re-frame/reg-sub
 ::round-deck
 (fn [db]
   (get-in db [:round :deck])))

(re-frame/reg-sub
 ::resources
 (fn [db]
   (get-in db [:game :run :resources])))

(re-frame/reg-sub
 ::view
 (fn [db]
   (get-in db [:ui :current-view])))

(re-frame/reg-sub
 ::collection
 (fn [db]
   (get-in db [:game :collection])))

(re-frame/reg-sub
 ::selected-deck
 (fn [db]
   (get-in db [:collection :decklists (get-in db [:ui :collection :selected-deck])])))

(re-frame/reg-sub
 ::selected-deck-key
 (fn [db]
   (get-in db [:ui :collection :selected-deck])))