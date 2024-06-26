import React, { useState, useEffect } from "react";
import { auth, firestore } from "./firebase";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ReminderApp = () => {
  const [reminders, setReminders] = useState([]);
  const [newMedicine, setNewMedicine] = useState("");
  const [newTime, setNewTime] = useState("");
  const [editingReminder, setEditingReminder] = useState(null);

  useEffect(() => {
    const unsubscribe = firestore
      .collection("reminders")
      .where("userId", "==", auth.currentUser.uid)
      .onSnapshot((snapshot) => {
        const newReminders = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setReminders(newReminders);
      });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Request notification permission on component mount
    Notification.requestPermission();
  }, []);

  const addReminder = async () => {
    if (newMedicine.trim() === "" || newTime.trim() === "") {
      alert("Please enter both medicine name and reminder time.");
      return;
    }

    if (editingReminder) {
      // Update existing reminder
      await firestore.collection("reminders").doc(editingReminder.id).update({
        medicine: newMedicine,
        time: newTime,
      });
      setEditingReminder(null);
      toast.success("Reminder updated successfully!");
    } else {
      // Save new reminder to Firestore
      await firestore.collection("reminders").add({
        userId: auth.currentUser.uid,
        medicine: newMedicine,
        time: newTime,
      });
      toast.success("Reminder added successfully!");
    }

    setNewMedicine("");
    setNewTime("");
    // Trigger notification for the new reminder
    triggerNotification(newMedicine, newTime);
  };

  const triggerNotification = (medicine, time) => {
    if (Notification.permission === "granted") {
      const notification = new Notification(`Time to take ${medicine}`, {
        body: `It's time to take your medication (${medicine}) at ${time}`,
      });

      notification.onclick = () => {
        // Handle notification click event, if needed
        console.log("Notification clicked");
      };
    }
  };

  const editReminder = (reminder) => {
    setEditingReminder(reminder);
    setNewMedicine(reminder.medicine);
    setNewTime(reminder.time);
  };

  const deleteReminder = async (reminderId) => {
    await firestore.collection("reminders").doc(reminderId).delete();
    toast.error("Reminder deleted successfully!");
  };

  return (
    <div className="medicine-reminder-app">
      <h1>Medicine Reminder App</h1>
      <div className="reminder-form">
        <label>
          Medicine:
          <input
            type="text"
            placeholder="Enter medicine name"
            value={newMedicine}
            onChange={(e) => setNewMedicine(e.target.value)}
          />
        </label>
        <label>
          Reminder Time:
          <input
            type="time"
            value={newTime}
            onChange={(e) => setNewTime(e.target.value)}
          />
        </label>
        <button onClick={addReminder}>
          {editingReminder ? "Update Reminder" : "Add Reminder"}
        </button>
      </div>
      <div className="reminder-list">
        <h2>Reminders:</h2>
        <ul>
          {reminders.map((reminder) => (
            <li key={reminder.id}>
              {reminder.medicine} - {reminder.time}
              <button onClick={() => editReminder(reminder)}>Edit</button>
              <button
                onClick={() => deleteReminder(reminder.id)}
                style={{ backgroundColor: "red" }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default ReminderApp;
