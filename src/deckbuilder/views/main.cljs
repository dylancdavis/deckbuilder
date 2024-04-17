(ns deckbuilder.views.main
  (:require
   [re-frame.core :as re-frame]
   [deckbuilder.subs :as subs]
   [deckbuilder.views.run :as run-panel]
   [deckbuilder.views.collection :as collection-view]))

(defn get-view [name] (name {:collection collection-view/collection-view :round run-panel/run-view}))

(def nav-divider [:div.nav-divider])

(defn main-panel []
  (let [view @(re-frame/subscribe [::subs/view])]
    [:<>
     [:h1.game-title "Deckbuilder"]
     [:div.main-content
      [:div.main-panel
       [:div.nav "Collection" nav-divider "Current Run" nav-divider "Shop"]
       ((get-view view))]]]))