(ns deckbuilder.game.run-test
  (:require [cljs.test :refer [deftest is]]
            [deckbuilder.game.run :refer [move-cards populate-draw-pile process-start-of-game draw-first-hand]]))

(def example-rules {:name "Example Rules"
                    :type :rules
                    :deck-limits {:size [0,0]}
                    :run-structure {:draw-amount 1
                                    :play-amount 1}
                    :end-conditions {:rounds 1}
                    :effects {:game-start [:add-cards :deck {::score 2 ::buy-basic 2}]}
                    :cost 2})

(def example-counter {:a 3 :b 2 :c 1})

(def example-run
  {:resources {:points 0}
   :cards {:draw-pile [] :hand [] :discard-pile []}
   :deck-info {:cards example-counter :rules-card example-rules}
   :data {}
   :effects []
   :outcomes []})

(def pre-move-run {:cards {:draw-pile [:a :b :c :d :e] :hand [:f :g :h :i] :discard-pile []}})
(def post-move-run {:cards {:draw-pile [:d :e] :hand [:f :g :h :i :a :b :c] :discard-pile []}})

(deftest move-cards-test
  (is (= post-move-run (move-cards pre-move-run :draw-pile :hand 3)) "Should move 3 cards from draw-pile to hand"))

(deftest populate-draw-pile-test
  (is (= example-counter (-> example-run populate-draw-pile :cards :draw-pile :frequencies))))

