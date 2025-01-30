(ns deckbuilder.utilities.counter-test
  (:require [cljs.test :refer [deftest testing is]]
            [deckbuilder.utilities.counter :refer [add sub total missing-counts merge-counters]]))

(deftest counter
  (testing "Counter"
    (testing "adds correctly"
      (is (= (add {} :a) {:a 1}) "Adding to empty counter")
      (is (= (add {:a 1} :a) {:a 2}) "Adding to existing key")
      (is (= (add {:a 1} :b) {:a 1 :b 1})) "Adding new key to existing counter")
    (testing "subtracts correctly"
      (is (= (sub {:a 1} :a) {}) "Subtracting to zero doesn't yield empty counter")
      (is (= (sub {:a 2} :a) {:a 1}) "Subtracting from existing key")
      (is (= (sub {:a 2} :b) {:a 2}) "Subtracting non-existing key")
      (is (= (sub {:a 2} :a 3) {}) "Subtracting more than available"))
    (testing "totals correctly"
      (is (= (total {}) 0) "Total of empty counter")
      (is (= (total {:a 1}) 1) "Total of one key")
      (is (= (total {:a 1 :b 2 :c 3}) 6) "Total of multiple keys"))
    (testing "counts missing correctly"
      (is (= (missing-counts {:a 1} {}) {:a 1}) "Should correctly subtract empty counter")
      (is (= (missing-counts {:a 1} {:a 1}) {}) "Should correctly return empty counter when counters are equal")
      (is (= (missing-counts {:a 3} {:a 1}) {:a 2}) "Should correctly subtract a single key")
      (is (= (missing-counts {:a 1} {:a 3}) {}) "Should return an empty counter when second is greater")
      (is (= (missing-counts {:a 3} {:b 3}) {:a 3}) "Should ignore keys not in first counter")
      (is (= (missing-counts {:a 3 :b 3 :c 3} {:a 1 :b 5 :d 3}) {:a 2 :c 3}) "Should count multiple keys correctly"))
    (testing "merges correctly"
      (is (= (merge-counters {:a 1} {:b 2}) {:a 1 :b 2}) "Merging two counters")
      (is (= (merge-counters {:a 1} {:a 2}) {:a 3}) "Merging two counters with same key"))))