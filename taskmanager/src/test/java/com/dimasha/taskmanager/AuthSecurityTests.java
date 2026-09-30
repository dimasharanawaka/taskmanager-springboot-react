package com.dimasha.taskmanager;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:taskmanager-security-test;MODE=MySQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password=",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
        "app.jwt.secret=VGhpc0lzQVN1ZmZpY2llbnRseUxvbmdEZXZlbG9wbWVudEtleUZvclRlc3Rz",
        "app.jwt.expiration=86400000"
})
class AuthSecurityTests {

    @Autowired
    private MockMvc mockMvc;

        private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    @BeforeEach
    void cleanDatabase() {
        taskRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void registrationSucceedsAndDuplicateIsRejected() throws Exception {
        String request = "{\"name\":\"Test User\",\"email\":\"TEST@example.com\",\"password\":\"secure-password\"}";

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isString())
                .andExpect(jsonPath("$.user.email").value("test@example.com"))
                .andExpect(jsonPath("$.user.password").doesNotExist());

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request))
                .andExpect(status().isConflict());
    }

    @Test
    void loginSucceedsWithCorrectPasswordAndRejectsIncorrectPassword() throws Exception {
        register("login@example.com", "secure-password");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"LOGIN@example.com\",\"password\":\"secure-password\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"login@example.com\",\"password\":\"wrong-password\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tasksRequireAuthenticationAndTamperedTokenIsRejected() throws Exception {
        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isUnauthorized());

        String token = register("token@example.com", "secure-password");
        String[] tokenParts = token.split("\\.");
        String signature = tokenParts[2];
        String changedFirstCharacter = signature.charAt(0) == 'a' ? "b" : "a";
        String tamperedToken = tokenParts[0] + "." + tokenParts[1] + "."
                + changedFirstCharacter + signature.substring(1);

        mockMvc.perform(get("/api/tasks").header("Authorization", "Bearer " + tamperedToken))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void usersCanOnlyReadAndModifyTheirOwnTasks() throws Exception {
        String userAToken = register("user-a@example.com", "secure-password");
        String userBToken = register("user-b@example.com", "secure-password");

        String createdTask = mockMvc.perform(post("/api/tasks")
                        .header("Authorization", "Bearer " + userAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"User A task\",\"description\":\"Private\",\"completed\":false}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("User A task"))
                .andReturn().getResponse().getContentAsString();
        long taskId = objectMapper.readTree(createdTask).get("id").asLong();

        mockMvc.perform(get("/api/tasks").header("Authorization", "Bearer " + userAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("User A task"));

        mockMvc.perform(get("/api/tasks").header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        String update = "{\"title\":\"Hijacked\",\"description\":\"No access\",\"completed\":true}";
        mockMvc.perform(put("/api/tasks/" + taskId)
                        .header("Authorization", "Bearer " + userBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(update))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/tasks/" + taskId)
                        .header("Authorization", "Bearer " + userBToken))
                .andExpect(status().isNotFound());
    }

    @Test
    void authenticatedUserCanRestoreTheirProfile() throws Exception {
        String token = register("me@example.com", "secure-password");

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("me@example.com"))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    private String register(String email, String password) throws Exception {
        String response = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Test User\",\"email\":\"" + email + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        JsonNode json = objectMapper.readTree(response);
        return json.get("token").asText();
    }
}
