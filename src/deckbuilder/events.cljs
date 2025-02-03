(ns deckbuilder.events
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.db :as db]
   [deckbuilder.game.round :as round]
   [deckbuilder.game.run :as run]
   [deckbuilder.game.cards :as cards]))

(re-frame/reg-event-db
 ::initialize-db
 (fn [_ _]
   db/new-db))

(re-frame/reg-event-db
 :advance-game
 (fn [db _]
   (update-in db [:round :deck] round/advance-deck)))

(re-frame/reg-event-db
 :select-deck
 (fn [db [_ deck-name]]
   (assoc-in db [:ui :collection :selected-deck] deck-name)))

(re-frame/reg-event-db
 :start-run
 (fn [db [_ deck]]
   (assoc-in (assoc-in db [:ui :current-view] [:run]) [:game :run] (run/make-run deck))))

(re-frame/reg-event-db
 :end-run
 (fn [db _]
   (assoc-in (assoc-in db [:ui :current-view] [:collection]) [:game :run] nil)))

(re-frame/reg-event-db
 :gain-resource
 (fn [db [_ resource-name amount]]
   (update-in db [:game :run :resources resource-name] + amount)))

(re-frame/reg-event-db
 :buy-basic
 (fn [db _]
   (assoc-in db [:view-data :modal-view] :buy-basic)))

(re-frame/reg-event-db
 :draw-cards
 (fn [db [_ n]] (update-in db [:game :run :cards] run/draw-cards n)))

(re-frame/reg-event-db
 :change-deck-name
 (fn [db [_ key new-name]] (assoc-in db [:game :collection :decklists key :name] new-name)))