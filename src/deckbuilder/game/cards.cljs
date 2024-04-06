(ns deckbuilder.game.cards)

(def score {:name "Score"
            :description "Gain 1 Point."
            :event [:gain-resource :points 1]
            :cost 0})

(def buy-basic {:name "Buy Basic"
                :description "Buy a Basic Card."
                :event [:buy-basic]
                :cost 2})

(def basic-rules {:name "Basic Rules"
                  :type :rules
                  :deck-limits {:size 0 :added-cards {:score 7 :buy-basic 1}}
                  :run-structure {:draw-amount 1
                                  :play-amount 1}
                  :end-conditions {:rounds 1}
                  :cost 2})

(def basic-cards #{score buy-basic basic-rules})

(def starting-deck-list (cons buy-basic (take 7 (repeat score))))

(defn with-keys [coll]
  (map-indexed (fn [idx item] (assoc item :key idx)) coll))

(def starting-round {:draw-pile (with-keys starting-deck-list) :hand nil
                     :discard-pile []})
