// import logo from "./logo.svg";
import "./App.css";
import { useState, useEffect } from "react";
// import lineSVG from "./Svg/line";
import axios from "axios";
import { toast } from "react-toastify";
import { GoogleGenerativeAI } from "@google/generative-ai";
function App() {
  const [resp, setResp] = useState("No response yet!");
  const [prompt, setPrompt] = useState("");
  const [ref, setRef] = useState("");
  const [refer, setReference] = useState("");
  const [dataArray, setDataArray] = useState([]);
  const [genLink, setGenLink] = useState("");
  const [copyStatus, setCopyStatus] = useState("Copy");
  const [emailStatus, setEmailStatus] = useState("Send email to subscribers");
  const [saveStatus, setSaveStatus] = useState("Save");
  const [generateStatus, setGenerateStatus] = useState("Generate");
  const [category, setCategory] = useState("");
  const [selectedOption, setSelectedOption] = useState(""); // To keep track of the selected option
  const genAI = new GoogleGenerativeAI(`${process.env.REACT_APP_AUTH_KEY_TWO}`);

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `You are a newsletter generating AI. Keep title within * symbol, subtitles within ** symbol, and paragraphs within *** symbol, and keep tags within two **** symbol and each tag must separate with a comma. generate newsletter taking reference from here: ${refer} and keep the title relative to user input and refernce data provided`,
  });
  // List of options for the dropdown
  const options = [
    "Technology",
    "Space research",
    "New innovation",
    "Web technology",
  ];

  // Handle change in selected option
  const handleSelectionChange = (event) => {
    setSelectedOption(event.target.value);
    setCategory(event.target.value)
    console.log(event.target.value); // Update the state with the selected option
  };
  const parseContent = (content) => {
    // Match the title (content between single * symbols)
    const titleMatch = content.match(/\*(.*?)\*/); // Matches text between two '*' symbols
    const parsedTitle = titleMatch ? titleMatch[1].trim() : "Untitled";

    const tagMatch = content.match(/\*\*\*\*(.*?)\*\*\*\*/);
    const parsedTag = tagMatch ? tagMatch[1].trim() : "No tags formed";
    const sectionsRegex = /\*\*(.*?)\*\*\s*\*\*\*(.*?)\*\*\*/g;
    const matches = [...content.matchAll(sectionsRegex)];
    const parsedSections = matches.map((match) => ({
      subtitle: match[1].trim(),
      paragraph: match[2].trim(),
    }));
    const date = new Date();
    const month = date.getMonth();
    const day = date.getDate();
    const year = date.getFullYear();
    // Update state with parsed content
    const dataObj = {
      title: parsedTitle,
      tag: parsedTag,
      category: category,
      date: new Date(year, month, day),
      content: matches.map((match) => ({
        subtitle: match[1].trim(),
        paragraph: match[2].trim(),
      })),
    };
    setGenLink(
      `${process.env.REACT_APP_GEN_LINK}/?=${encodeURIComponent(parsedTitle)}`
    );

    setDataArray(dataObj);
    console.log(dataObj);
  };
  const loadRefDetails = async () => {
    // e.preventDefault();
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/scrapeRef`,
        {
          url: `${ref}`,
        },
        {
          headers: {
            "X-API-KEY": process.env.REACT_APP_AUTH_KEY,
          },
        }
      );
      const data = response.data.reference;
      console.log(data);
      setReference(data);
      return data;
    } catch (err) {
      console.log(err);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const refContent = await loadRefDetails();
    setGenerateStatus("Generating...");
    try {
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 1000,
          temperature: 0.1,
        },
      });
      console.log("API response:", result.response.text());
      const resp = result.response.text();
      parseContent(resp);
      setGenerateStatus("Generated");
      setTimeout(() => {
        setGenerateStatus("Generate again");
      }, 4000);
    } catch (error) {
      console.error("API request failed:", error);
    }
  };

  const handleCopy = async () => {
    navigator.clipboard.writeText(genLink).then(() => setCopyStatus("Copied"));
    toast.success("Copied to clipboard", {
      position: toast.POSITION.TOP_CENTER,
    });
    setTimeout(() => {
      setCopyStatus("Copy");
    }, 2000);
  };
  const handleSave = async () => {
    setSaveStatus("Saving...");
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/addData`,
        dataArray,
        {
          headers: {
            "X-API-KEY": process.env.REACT_APP_AUTH_KEY,
          },
        }
      );
      const data = response.data;
      if (data.code === 200) {
        setSaveStatus("Saved");
        toast.success("Data saved successfully", {
          position: toast.POSITION.TOP_CENTER,
        });
        setTimeout(() => {
          setSaveStatus("Save");
        }, [3000]);
      } else {
        setSaveStatus("Try again");
        toast.error("Failed to save, Try again!", {
          position: toast.POSITION.TOP_CENTER,
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  const sendEmail = async () => {
    setEmailStatus("Sending...");
    try {
      const resp = await axios.post(
        `${process.env.REACT_APP_BASE_URL}/sendEmail`,
        {
          title: dataArray.title,
          link: genLink,
          des: dataArray.content[0].paragraph,
          subs: selectedOption,
        },
        {
          headers: {
            "X-API-KEY": process.env.REACT_APP_AUTH_KEY,
          },
        }
      );
      const data = resp.data.status;
      alert(data);
      setEmailStatus("Email sent!");
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div className="App">
      <header>
        <button>
          <p>
            newsletter<b>.ai</b>
          </p>
        </button>
      </header>
      <div className="campusai">
        <h1>Newsletter AI</h1>
        <h3>Let's teach some minds today!</h3>
        <br />
        <form onSubmit={onSubmit}>
          <label htmlFor="topic">Topic</label>
          <input
            name="topic"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask anything..."
          />
          <label style={{ fontSize: "16px" }} htmlFor="dropdown">
            Category:
          </label>
          <select
            id="dropdown"
            value={selectedOption}
            onChange={handleSelectionChange}
          >
            <option value="" disabled>
              Select category
            </option>{" "}
            {/* Default option */}
            {options.map((option, index) => (
              <option
                onChange={(e) => {
                  console.log(e.target.value);
                  setCategory(()=>e.target.value);
                }}
                style={{ color: "#000" }}
                key={index}
                value={option}
              >
                {option}
              </option> // Render each option dynamically
            ))}
          </select>
          <label htmlFor="refURL">Reference URL</label>
          <input
            name="refURL"
            type="text"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="Enter reference url"
          />
          <button type="submit">{generateStatus}</button>
        </form>

        <div className="answers">
          <div className="answers-content">
            <h2>{dataArray.title}</h2>
            {dataArray.content?.length > 0 ? (
              dataArray.content.map((section, index) => (
                <div key={index}>
                  <h3 style={{ fontSize: "20px", fontWeight: "600" }}>
                    {section.subtitle}
                  </h3>
                  <p style={{ fontSize: "18px" }}>{section.paragraph}</p>
                </div>
              ))
            ) : (
              <p>No content available. Please try again.</p>
            )}
          </div>
        </div>
        <div>
          <button onClick={handleSave} className="saveBtn">
            {saveStatus}
          </button>
          <input
            readOnly
            name="sharingLink"
            type="text"
            value={genLink}
            placeholder="Shareable link"
            style={{
              width: "20%",
              backgroundColor: "#fff",
              paddingLeft: "12px",
              fontSize: "14px",
              fontWeight: "500",
              color: "#00000090",
            }}
          />
          <button onClick={handleCopy} className="copyBtn">
            {copyStatus}
          </button>
          <button onClick={sendEmail} className="emailBtn">
            {emailStatus}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
