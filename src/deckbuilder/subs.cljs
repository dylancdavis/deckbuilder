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
   (get-in db [:round :resources])))

(re-frame/reg-sub
 ::view
 (fn [db]
   (:view db)))

(re-frame/reg-sub
 ::collection
 (fn [db]
   (:collection db)))

(re-frame/reg-sub
 ::selected-deck
 (fn [db]
   (get-in db [:collection :decklists (get-in db [:view-data :selected-deck])])))

(re-frame/reg-sub
 ::modal-view
 (fn [db]
   (get-in db [:view-data :modal-view])))